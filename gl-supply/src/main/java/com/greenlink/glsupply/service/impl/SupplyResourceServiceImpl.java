package com.greenlink.glsupply.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.Result;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glsupply.domain.SupplyAttachment;
import com.greenlink.glsupply.domain.SupplyResource;
import com.greenlink.glsupply.dto.request.AdminResourcePageRequest;
import com.greenlink.glsupply.dto.request.AttachmentDTO;
import com.greenlink.glsupply.dto.request.CreateResourceRequest;
import com.greenlink.glsupply.dto.request.ResourcePageRequest;
import com.greenlink.glsupply.dto.request.UpdateResourceRequest;
import com.greenlink.glsupply.dto.response.AdminResourceVO;
import com.greenlink.glsupply.dto.response.AttachmentVO;
import com.greenlink.glsupply.dto.response.ResourceDetailVO;
import com.greenlink.glsupply.dto.response.ResourceVO;
import com.greenlink.glsupply.dto.response.SupplyBriefVO;
import com.greenlink.glsupply.dto.response.TagSimpleVO;
import com.greenlink.glsupply.enums.AuditStatus;
import com.greenlink.glsupply.es.EsPageResult;
import com.greenlink.glsupply.es.ResourceEsSyncService;
import com.greenlink.glsupply.feign.TagRelationClient;
import com.greenlink.glsupply.helper.ResourceViewCountHelper;
import com.greenlink.glsupply.mq.ResourceEventProducer;
import com.greenlink.glsupply.repository.SupplyAttachmentMapper;
import com.greenlink.glsupply.repository.SupplyResourceMapper;
import com.greenlink.glsupply.service.SupplyResourceService;
import com.greenlink.glsupply.util.HtmlSanitizerUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplyResourceServiceImpl implements SupplyResourceService {

    static final String BIZ_TYPE = "RESOURCE";

    private final SupplyResourceMapper resourceMapper;
    private final SupplyAttachmentMapper attachmentMapper;

    @Autowired(required = false)
    private TagRelationClient tagRelationClient;

    @Autowired(required = false)
    private ResourceEventProducer eventProducer;

    @Autowired(required = false)
    private ResourceViewCountHelper viewCountHelper;

    @Autowired(required = false)
    private ResourceEsSyncService esSyncService;

    @Override
    @Transactional
    public ResourceDetailVO create(CreateResourceRequest request, Long memberId, Long accountId) {
        SupplyResource resource = new SupplyResource();
        resource.setMemberId(memberId);
        resource.setAccountId(accountId);
        resource.setType(request.getType());
        resource.setTitle(request.getTitle());
        resource.setContent(HtmlSanitizerUtil.sanitize(request.getContent()));
        resource.setSummary(request.getSummary());
        resource.setProvince(request.getProvince());
        resource.setCity(request.getCity());
        resource.setCooperationMode(request.getCooperationMode());
        resource.setValidUntil(request.getValidUntil());
        resource.setContactVisible(Boolean.FALSE.equals(request.getContactVisible()) ? 0 : 1);
        resource.setViewCount(0);
        resource.setAuditStatus(AuditStatus.PENDING.getCode());

        resourceMapper.insert(resource);
        log.info("创建资源 id={} memberId={}", resource.getId(), memberId);

        saveAttachments(resource.getId(), request.getAttachments());
        syncTags(resource.getId(), request.getTagIds());
        sendSaveEvent(resource.getId());

        return buildDetailVO(resource);
    }

    @Override
    public Page<ResourceVO> pageList(ResourcePageRequest request) {
        // tagId 过滤：先从 gl-tag 取该标签关联的 resourceId 白名单
        List<Long> tagScopeIds = resolveTagScopeIds(request.getTagId());
        // 如果指定了 tagId 但没有任何资源挂这个标签，直接返回空
        if (request.getTagId() != null && tagScopeIds != null && tagScopeIds.isEmpty()) {
            return emptyPage(request);
        }

        // 有关键词时走 ES 路径，无关键词时走 MySQL 路径
        if (StringUtils.hasText(request.getKeyword()) && esSyncService != null) {
            return pageListByEs(request, tagScopeIds);
        }
        return pageListByMysql(request, tagScopeIds);
    }

    private Page<ResourceVO> pageListByEs(ResourcePageRequest request, List<Long> scopeIds) {
        EsPageResult esResult;
        try {
            esResult = esSyncService.searchByKeyword(
                    request.getKeyword(), request.getType(), request.getProvince(),
                    scopeIds, request.getPage(), request.getSize());
        } catch (Exception e) {
            log.warn("ES 检索异常，降级到 MySQL 路径 keyword={}", request.getKeyword(), e);
            return pageListByMysql(request, scopeIds);
        }

        if (esResult.orderedIds().isEmpty()) {
            return emptyPage(request);
        }

        // 按 ES 返回的有序 ID 从 MySQL 取完整字段。
        // auditStatus=APPROVED 二次校验：ES 同步存在延迟窗口，资源被拒绝后 ES 可能仍持有旧状态，
        // 此处过滤确保即使 ES 数据陈旧也不泄露非公开资源。
        QueryWrapper<SupplyResource> wrapper = new QueryWrapper<SupplyResource>()
                .select("id", "member_id", "type", "title", "summary", "province", "city",
                        "valid_until", "view_count", "audit_status", "created_at")
                .in("id", esResult.orderedIds())
                .eq("audit_status", AuditStatus.APPROVED.getCode());

        List<SupplyResource> dbRecords = resourceMapper.selectList(wrapper);

        // 在内存中按 ES 相关性顺序重排
        Map<Long, SupplyResource> idMap = dbRecords.stream()
                .collect(Collectors.toMap(SupplyResource::getId, r -> r));
        List<ResourceVO> vos = esResult.orderedIds().stream()
                .filter(idMap::containsKey)
                .map(id -> toVOWithHighlight(idMap.get(id),
                        esResult.highlightTitles().get(id),
                        esResult.highlightSummaries().get(id)))
                .toList();

        Page<ResourceVO> voPage = new Page<>(request.getPage(), request.getSize(), esResult.total());
        voPage.setRecords(vos);
        return voPage;
    }

    private Page<ResourceVO> pageListByMysql(ResourcePageRequest request, List<Long> scopeIds) {
        QueryWrapper<SupplyResource> wrapper = new QueryWrapper<SupplyResource>()
                .select("id", "member_id", "type", "title", "summary", "province", "city",
                        "valid_until", "view_count", "audit_status", "created_at")
                // 公开接口只返回已审核通过的资源，调用方不得覆盖此过滤
                .eq("audit_status", AuditStatus.APPROVED.getCode())
                .eq(StringUtils.hasText(request.getType()), "type", request.getType())
                .eq(StringUtils.hasText(request.getProvince()), "province", request.getProvince())
                .eq(request.getMemberId() != null, "member_id", request.getMemberId())
                // ES 降级时 keyword 仍通过 MySQL LIKE 保持过滤，防止降级路径返回全量数据
                .and(StringUtils.hasText(request.getKeyword()), q -> q
                        .like("title", request.getKeyword())
                        .or().like("summary", request.getKeyword()))
                .orderByDesc("created_at");

        if (!CollectionUtils.isEmpty(scopeIds)) {
            wrapper.in("id", scopeIds);
        }

        Page<SupplyResource> dbPage = resourceMapper.selectPage(
                new Page<>(request.getPage(), request.getSize()), wrapper);

        Page<ResourceVO> voPage = new Page<>(dbPage.getCurrent(), dbPage.getSize(), dbPage.getTotal());
        // 列表接口不逐条调 gl-tag，避免 N+1 Feign 请求；标签在详情接口单独获取
        voPage.setRecords(dbPage.getRecords().stream().map(this::toVO).toList());
        return voPage;
    }

    /** 调用 gl-tag 取 tagId 关联的 resourceId 列表；null 表示未指定 tagId（不过滤） */
    private List<Long> resolveTagScopeIds(Long tagId) {
        if (tagId == null || tagRelationClient == null) return null;
        try {
            Result<List<Long>> result = tagRelationClient.getBizIdsByTag(tagId, BIZ_TYPE);
            return result != null && result.getData() != null ? result.getData() : Collections.emptyList();
        } catch (Exception e) {
            log.warn("获取标签资源 ID 失败 tagId={}，tagId 过滤已忽略", tagId, e);
            return null;
        }
    }

    private Page<ResourceVO> emptyPage(ResourcePageRequest request) {
        Page<ResourceVO> empty = new Page<>(request.getPage(), request.getSize(), 0);
        empty.setRecords(Collections.emptyList());
        return empty;
    }

    @Override
    public Page<ResourceVO> minePageList(Long memberId, ResourcePageRequest request) {
        QueryWrapper<SupplyResource> wrapper = new QueryWrapper<SupplyResource>()
                .select("id", "member_id", "type", "title", "summary", "province", "city",
                        "valid_until", "view_count", "audit_status", "created_at")
                .eq("member_id", memberId)
                .eq(request.getAuditStatus() != null, "audit_status", request.getAuditStatus())
                .eq(StringUtils.hasText(request.getType()), "type", request.getType())
                .and(StringUtils.hasText(request.getKeyword()), q -> q
                        .like("title", request.getKeyword())
                        .or().like("summary", request.getKeyword()))
                .orderByDesc("created_at");

        Page<SupplyResource> dbPage = resourceMapper.selectPage(
                new Page<>(request.getPage(), request.getSize()), wrapper);

        Page<ResourceVO> voPage = new Page<>(dbPage.getCurrent(), dbPage.getSize(), dbPage.getTotal());
        voPage.setRecords(dbPage.getRecords().stream().map(this::toVO).toList());
        return voPage;
    }

    @Override
    public ResourceDetailVO getById(Long id, Long accountId) {
        SupplyResource resource = resourceMapper.selectById(id);
        if (resource == null) {
            throw new BizException(ResultCode.RESOURCE_NOT_FOUND);
        }
        if (viewCountHelper != null) {
            viewCountHelper.increment(id);
        }
        ResourceDetailVO vo = buildDetailVO(resource);
        // 非本会员且 contactVisible=0 时不返回内容（联系方式在详情接口由前端处理）
        return vo;
    }

    @Override
    @Transactional
    public ResourceDetailVO update(Long id, UpdateResourceRequest request, Long accountId) {
        SupplyResource resource = getOwnResource(id, accountId);

        if (request.getType() != null) resource.setType(request.getType());
        if (request.getTitle() != null) resource.setTitle(request.getTitle());
        if (request.getContent() != null) resource.setContent(HtmlSanitizerUtil.sanitize(request.getContent()));
        if (request.getSummary() != null) resource.setSummary(request.getSummary());
        if (request.getProvince() != null) resource.setProvince(request.getProvince());
        if (request.getCity() != null) resource.setCity(request.getCity());
        if (request.getCooperationMode() != null) resource.setCooperationMode(request.getCooperationMode());
        if (request.getValidUntil() != null) resource.setValidUntil(request.getValidUntil());
        if (request.getContactVisible() != null) resource.setContactVisible(Boolean.FALSE.equals(request.getContactVisible()) ? 0 : 1);

        // 更新后重置为待审核
        resource.setAuditStatus(AuditStatus.PENDING.getCode());
        resource.setAuditRemark(null);

        resourceMapper.updateById(resource);
        log.info("更新资源 id={} accountId={}", id, accountId);

        if (request.getAttachments() != null) {
            replaceAttachments(id, request.getAttachments());
        }
        if (request.getTagIds() != null) {
            syncTags(id, request.getTagIds());
        }
        sendSaveEvent(id);

        return buildDetailVO(resource);
    }

    @Override
    @Transactional
    public void delete(Long id, Long accountId) {
        getOwnResource(id, accountId);
        resourceMapper.deleteById(id);
        attachmentMapper.delete(new LambdaQueryWrapper<SupplyAttachment>()
                .eq(SupplyAttachment::getBizType, BIZ_TYPE)
                .eq(SupplyAttachment::getBizId, id));
        log.info("删除资源 id={} accountId={}", id, accountId);
        sendDeleteEvent(id);
        // 标签关联删除在事务提交后执行：Feign 是跨服务调用，不参与本地事务。
        // 若在事务内调用失败会错误地回滚已完成的 DB 操作；
        // 移至 afterCommit 后，DB 提交成功才触发，Feign 失败仅产生孤立标签记录，
        // 不影响资源本身数据一致性，且已有日志可追查。
        if (tagRelationClient != null) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        tagRelationClient.deleteByBiz(BIZ_TYPE, id);
                    } catch (Exception e) {
                        log.warn("删除资源标签关联失败 resourceId={}，tag_relation 表存在孤立记录", id, e);
                    }
                }
            });
        }
    }

    @Override
    @Transactional
    public void withdraw(Long id, Long accountId) {
        SupplyResource resource = getOwnResource(id, accountId);
        if (!Integer.valueOf(AuditStatus.APPROVED.getCode()).equals(resource.getAuditStatus())) {
            throw new BizException(ResultCode.RESOURCE_AUDIT_INVALID_STATUS,
                    "仅已上架的资源可以撤回");
        }
        resource.setAuditStatus(AuditStatus.OFFLINE.getCode());
        resourceMapper.updateById(resource);
        log.info("撤回资源 id={} accountId={}", id, accountId);
        sendSaveEvent(id);
    }

    @Override
    public Page<AdminResourceVO> adminPageList(AdminResourcePageRequest request) {
        QueryWrapper<SupplyResource> wrapper = new QueryWrapper<SupplyResource>()
                .select("id", "member_id", "account_id", "type", "title", "summary",
                        "province", "city", "valid_until", "view_count",
                        "audit_status", "audit_remark", "auditor_id", "audited_at", "created_at")
                .eq(StringUtils.hasText(request.getType()), "type", request.getType())
                .eq(StringUtils.hasText(request.getProvince()), "province", request.getProvince())
                .eq(request.getAuditStatus() != null, "audit_status", request.getAuditStatus())
                .eq(request.getMemberId() != null, "member_id", request.getMemberId())
                .and(StringUtils.hasText(request.getKeyword()), q -> q
                        .like("title", request.getKeyword())
                        .or().like("summary", request.getKeyword()))
                .eq("is_deleted", 0)
                .orderByDesc("created_at");

        Page<SupplyResource> dbPage = resourceMapper.selectPage(
                new Page<>(request.getPage(), request.getSize()), wrapper);

        Page<AdminResourceVO> voPage = new Page<>(dbPage.getCurrent(), dbPage.getSize(), dbPage.getTotal());
        voPage.setRecords(dbPage.getRecords().stream().map(this::toAdminVO).toList());
        return voPage;
    }

    @Override
    @Transactional
    public void approve(Long id, Long auditorId) {
        SupplyResource resource = resourceMapper.selectById(id);
        if (resource == null) {
            throw new BizException(ResultCode.RESOURCE_NOT_FOUND);
        }
        if (!Integer.valueOf(AuditStatus.PENDING.getCode()).equals(resource.getAuditStatus())) {
            throw new BizException(ResultCode.RESOURCE_AUDIT_INVALID_STATUS);
        }
        resource.setAuditStatus(AuditStatus.APPROVED.getCode());
        resource.setAuditorId(auditorId);
        resource.setAuditedAt(LocalDateTime.now());
        resource.setAuditRemark(null);
        resourceMapper.updateById(resource);
        log.info("审核通过资源 id={} auditorId={}", id, auditorId);
        sendSaveEvent(id);
    }

    @Override
    @Transactional
    public void reject(Long id, Long auditorId, String remark) {
        SupplyResource resource = resourceMapper.selectById(id);
        if (resource == null) {
            throw new BizException(ResultCode.RESOURCE_NOT_FOUND);
        }
        if (!Integer.valueOf(AuditStatus.PENDING.getCode()).equals(resource.getAuditStatus())) {
            throw new BizException(ResultCode.RESOURCE_AUDIT_INVALID_STATUS);
        }
        resource.setAuditStatus(AuditStatus.REJECTED.getCode());
        resource.setAuditorId(auditorId);
        resource.setAuditedAt(LocalDateTime.now());
        resource.setAuditRemark(remark);
        resourceMapper.updateById(resource);
        log.info("审核拒绝资源 id={} auditorId={} remark={}", id, auditorId, remark);
        sendSaveEvent(id);
    }

    @Override
    @Transactional
    public void adminOffline(Long id, Long auditorId) {
        SupplyResource resource = resourceMapper.selectById(id);
        if (resource == null) {
            throw new BizException(ResultCode.RESOURCE_NOT_FOUND);
        }
        if (!Integer.valueOf(AuditStatus.APPROVED.getCode()).equals(resource.getAuditStatus())) {
            throw new BizException(ResultCode.RESOURCE_AUDIT_INVALID_STATUS);
        }
        resource.setAuditStatus(AuditStatus.OFFLINE.getCode());
        resource.setAuditorId(auditorId);
        resource.setAuditedAt(LocalDateTime.now());
        resourceMapper.updateById(resource);
        log.info("管理端下架资源 id={} auditorId={}", id, auditorId);
        sendSaveEvent(id);
    }

    // -------- private helpers --------

    private SupplyResource getOwnResource(Long id, Long accountId) {
        SupplyResource resource = resourceMapper.selectById(id);
        if (resource == null) {
            throw new BizException(ResultCode.RESOURCE_NOT_FOUND);
        }
        // null accountId 视为未授权，而非静默放行
        if (accountId == null || !accountId.equals(resource.getAccountId())) {
            throw new BizException(ResultCode.PERMISSION_DENIED);
        }
        return resource;
    }

    private void saveAttachments(Long resourceId, List<AttachmentDTO> attachments) {
        if (CollectionUtils.isEmpty(attachments)) return;
        List<SupplyAttachment> entities = new java.util.ArrayList<>(attachments.size());
        for (int i = 0; i < attachments.size(); i++) {
            AttachmentDTO dto = attachments.get(i);
            SupplyAttachment att = new SupplyAttachment();
            att.setBizType(BIZ_TYPE);
            att.setBizId(resourceId);
            att.setFileName(dto.getFileName());
            att.setFileUrl(dto.getFileUrl());
            att.setFileSize(dto.getFileSize());
            att.setFileType(dto.getFileType());
            att.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : i);
            entities.add(att);
        }
        attachmentMapper.batchInsert(entities);
    }

    private void replaceAttachments(Long resourceId, List<AttachmentDTO> attachments) {
        attachmentMapper.delete(new LambdaQueryWrapper<SupplyAttachment>()
                .eq(SupplyAttachment::getBizType, BIZ_TYPE)
                .eq(SupplyAttachment::getBizId, resourceId));
        saveAttachments(resourceId, attachments);
    }

    @Override
    public List<SupplyBriefVO> batchBrief(List<Long> ids) {
        if (CollectionUtils.isEmpty(ids)) {
            return Collections.emptyList();
        }
        QueryWrapper<SupplyResource> qw = new QueryWrapper<SupplyResource>()
                .select("id", "member_id", "province", "type", "audit_status", "title", "summary")
                .in("id", ids)
                .eq("is_deleted", 0);
        return resourceMapper.selectList(qw).stream().map(r -> {
            SupplyBriefVO vo = new SupplyBriefVO();
            vo.setId(r.getId());
            vo.setMemberId(r.getMemberId());
            vo.setProvince(r.getProvince());
            vo.setType(r.getType());
            vo.setAuditStatus(r.getAuditStatus());
            vo.setTitle(r.getTitle());
            vo.setSummary(r.getSummary());
            return vo;
        }).toList();
    }

    private void syncTags(Long resourceId, List<Long> tagIds) {
        if (tagRelationClient == null) return;
        Map<String, Object> req = new HashMap<>();
        req.put("bizType", BIZ_TYPE);
        req.put("bizId", resourceId);
        req.put("tagIds", tagIds != null ? tagIds : Collections.emptyList());
        try {
            tagRelationClient.batchSet(req);
        } catch (Exception e) {
            log.warn("标签同步失败 resourceId={}", resourceId, e);
        }
    }

    private List<TagSimpleVO> getTagsByResource(Long resourceId) {
        if (tagRelationClient == null) return Collections.emptyList();
        try {
            Result<List<TagSimpleVO>> result = tagRelationClient.getByBiz(BIZ_TYPE, resourceId);
            return result != null && result.getData() != null ? result.getData() : Collections.emptyList();
        } catch (Exception e) {
            log.warn("获取标签失败 resourceId={}", resourceId, e);
            return Collections.emptyList();
        }
    }

    private List<AttachmentVO> getAttachments(Long resourceId) {
        List<SupplyAttachment> list = attachmentMapper.selectList(
                new LambdaQueryWrapper<SupplyAttachment>()
                        .eq(SupplyAttachment::getBizType, BIZ_TYPE)
                        .eq(SupplyAttachment::getBizId, resourceId)
                        .orderByAsc(SupplyAttachment::getSortOrder));
        return list.stream().map(a -> {
            AttachmentVO vo = new AttachmentVO();
            vo.setId(a.getId());
            vo.setFileName(a.getFileName());
            vo.setFileUrl(a.getFileUrl());
            vo.setFileSize(a.getFileSize());
            vo.setFileType(a.getFileType());
            vo.setSortOrder(a.getSortOrder());
            return vo;
        }).toList();
    }

    private ResourceDetailVO buildDetailVO(SupplyResource r) {
        ResourceDetailVO vo = new ResourceDetailVO();
        vo.setId(r.getId());
        vo.setMemberId(r.getMemberId());
        vo.setAccountId(r.getAccountId());
        vo.setType(r.getType());
        vo.setTitle(r.getTitle());
        vo.setContent(r.getContent());
        vo.setSummary(r.getSummary());
        vo.setProvince(r.getProvince());
        vo.setCity(r.getCity());
        vo.setCooperationMode(r.getCooperationMode());
        vo.setValidUntil(r.getValidUntil());
        vo.setViewCount(r.getViewCount() != null ? r.getViewCount() : 0);
        vo.setContactVisible(r.getContactVisible());
        vo.setAuditStatus(r.getAuditStatus());
        vo.setAuditRemark(r.getAuditRemark());
        vo.setAuditorId(r.getAuditorId());
        vo.setAuditedAt(r.getAuditedAt());
        vo.setCreatedAt(r.getCreatedAt());
        vo.setUpdatedAt(r.getUpdatedAt());
        if (r.getId() != null) {
            vo.setAttachments(getAttachments(r.getId()));
            vo.setTags(getTagsByResource(r.getId()));
        }
        return vo;
    }

    private ResourceVO toVO(SupplyResource r) {
        return toVOWithHighlight(r, null, null);
    }

    private ResourceVO toVOWithHighlight(SupplyResource r, String hlTitle, String hlSummary) {
        ResourceVO vo = new ResourceVO();
        vo.setId(r.getId());
        vo.setMemberId(r.getMemberId());
        vo.setType(r.getType());
        vo.setTitle(r.getTitle());
        vo.setSummary(r.getSummary());
        vo.setHighlightTitle(hlTitle);
        vo.setHighlightSummary(hlSummary);
        vo.setProvince(r.getProvince());
        vo.setCity(r.getCity());
        vo.setValidUntil(r.getValidUntil());
        vo.setViewCount(r.getViewCount() != null ? r.getViewCount() : 0);
        vo.setAuditStatus(r.getAuditStatus());
        vo.setCreatedAt(r.getCreatedAt());
        return vo;
    }

    private AdminResourceVO toAdminVO(SupplyResource r) {
        AdminResourceVO vo = new AdminResourceVO();
        vo.setId(r.getId());
        vo.setMemberId(r.getMemberId());
        vo.setAccountId(r.getAccountId());
        vo.setType(r.getType());
        vo.setTitle(r.getTitle());
        vo.setSummary(r.getSummary());
        vo.setProvince(r.getProvince());
        vo.setCity(r.getCity());
        vo.setValidUntil(r.getValidUntil());
        vo.setViewCount(r.getViewCount() != null ? r.getViewCount() : 0);
        vo.setAuditStatus(r.getAuditStatus());
        vo.setAuditRemark(r.getAuditRemark());
        vo.setAuditorId(r.getAuditorId());
        vo.setAuditedAt(r.getAuditedAt());
        vo.setCreatedAt(r.getCreatedAt());
        vo.setTags(getTagsByResource(r.getId()));
        return vo;
    }

    private void sendSaveEvent(Long resourceId) {
        if (eventProducer != null) {
            eventProducer.sendSave(resourceId);
        }
    }

    private void sendDeleteEvent(Long resourceId) {
        if (eventProducer != null) {
            eventProducer.sendDelete(resourceId);
        }
    }
}
