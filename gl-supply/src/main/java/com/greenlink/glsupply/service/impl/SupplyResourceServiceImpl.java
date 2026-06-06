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
import com.greenlink.glsupply.dto.response.TagSimpleVO;
import com.greenlink.glsupply.enums.AuditStatus;
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
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
        QueryWrapper<SupplyResource> wrapper = new QueryWrapper<SupplyResource>()
                .select("id", "member_id", "type", "title", "summary", "province", "city",
                        "valid_until", "view_count", "audit_status", "created_at")
                .eq(StringUtils.hasText(request.getType()), "type", request.getType())
                .eq(StringUtils.hasText(request.getProvince()), "province", request.getProvince())
                .eq(request.getAuditStatus() != null, "audit_status", request.getAuditStatus())
                .eq(request.getMemberId() != null, "member_id", request.getMemberId())
                .and(StringUtils.hasText(request.getKeyword()), q -> q
                        .like("title", request.getKeyword())
                        .or().like("summary", request.getKeyword()))
                .orderByDesc("created_at");

        Page<SupplyResource> dbPage = resourceMapper.selectPage(
                new Page<>(request.getPage(), request.getSize()), wrapper);

        Page<ResourceVO> voPage = new Page<>(dbPage.getCurrent(), dbPage.getSize(), dbPage.getTotal());
        voPage.setRecords(dbPage.getRecords().stream()
                .map(r -> {
                    ResourceVO vo = toVO(r);
                    vo.setTags(getTagsByResource(r.getId()));
                    return vo;
                })
                .toList());
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
        if (tagRelationClient != null) {
            tagRelationClient.deleteByBiz(BIZ_TYPE, id);
        }
        log.info("删除资源 id={} accountId={}", id, accountId);
        sendDeleteEvent(id);
    }

    @Override
    @Transactional
    public void withdraw(Long id, Long accountId) {
        SupplyResource resource = getOwnResource(id, accountId);
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
        if (resource.getAuditStatus() != AuditStatus.PENDING.getCode()) {
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
        if (resource.getAuditStatus() != AuditStatus.PENDING.getCode()) {
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
        if (resource.getAuditStatus() != AuditStatus.APPROVED.getCode()) {
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
        if (accountId != null && !accountId.equals(resource.getAccountId())) {
            throw new BizException(ResultCode.PERMISSION_DENIED);
        }
        return resource;
    }

    private void saveAttachments(Long resourceId, List<AttachmentDTO> attachments) {
        if (CollectionUtils.isEmpty(attachments)) return;
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
            attachmentMapper.insert(att);
        }
    }

    private void replaceAttachments(Long resourceId, List<AttachmentDTO> attachments) {
        attachmentMapper.delete(new LambdaQueryWrapper<SupplyAttachment>()
                .eq(SupplyAttachment::getBizType, BIZ_TYPE)
                .eq(SupplyAttachment::getBizId, resourceId));
        saveAttachments(resourceId, attachments);
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
        ResourceVO vo = new ResourceVO();
        vo.setId(r.getId());
        vo.setMemberId(r.getMemberId());
        vo.setType(r.getType());
        vo.setTitle(r.getTitle());
        vo.setSummary(r.getSummary());
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
