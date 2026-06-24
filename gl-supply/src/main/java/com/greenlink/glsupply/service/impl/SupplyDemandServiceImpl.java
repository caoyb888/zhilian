package com.greenlink.glsupply.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.Result;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glsupply.domain.SupplyAttachment;
import com.greenlink.glsupply.domain.SupplyDemand;
import com.greenlink.glsupply.dto.request.AdminDemandPageRequest;
import com.greenlink.glsupply.dto.request.AttachmentDTO;
import com.greenlink.glsupply.dto.request.CreateDemandRequest;
import com.greenlink.glsupply.dto.request.DemandPageRequest;
import com.greenlink.glsupply.dto.request.UpdateDemandRequest;
import com.greenlink.glsupply.dto.response.AdminDemandVO;
import com.greenlink.glsupply.dto.response.AttachmentVO;
import com.greenlink.glsupply.dto.response.BatchAuditResultVO;
import com.greenlink.glsupply.dto.response.DemandDetailVO;
import com.greenlink.glsupply.dto.response.DemandVO;
import com.greenlink.glsupply.dto.response.SupplyBriefVO;
import com.greenlink.glsupply.dto.response.TagSimpleVO;
import com.greenlink.glsupply.enums.AuditStatus;
import com.greenlink.glsupply.es.DemandEsSyncService;
import com.greenlink.glsupply.feign.TagRelationClient;
import com.greenlink.glsupply.helper.ResourceViewCountHelper;
import com.greenlink.glsupply.repository.SupplyAttachmentMapper;
import com.greenlink.glsupply.repository.SupplyDemandMapper;
import com.greenlink.glsupply.service.SupplyDemandService;
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
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplyDemandServiceImpl implements SupplyDemandService {

    static final String BIZ_TYPE = "DEMAND";

    private final SupplyDemandMapper demandMapper;
    private final SupplyAttachmentMapper attachmentMapper;

    @Autowired(required = false)
    private TagRelationClient tagRelationClient;

    @Autowired(required = false)
    private DemandEsSyncService demandEsSyncService;

    @Autowired(required = false)
    private ResourceViewCountHelper viewCountHelper;

    @Override
    @Transactional
    public DemandDetailVO create(CreateDemandRequest request, Long memberId, Long accountId) {
        SupplyDemand demand = new SupplyDemand();
        demand.setMemberId(memberId);
        demand.setAccountId(accountId);
        demand.setType(request.getType());
        demand.setTitle(request.getTitle());
        demand.setContent(HtmlSanitizerUtil.sanitize(request.getContent()));
        demand.setSummary(request.getSummary());
        demand.setProvince(request.getProvince());
        demand.setBudgetMin(request.getBudgetMin());
        demand.setBudgetMax(request.getBudgetMax());
        demand.setDeadline(request.getDeadline());
        demand.setCooperationMode(request.getCooperationMode());
        demand.setViewCount(0);
        demand.setAuditStatus(AuditStatus.PENDING.getCode());

        demandMapper.insert(demand);
        log.info("创建需求 id={} memberId={}", demand.getId(), memberId);

        saveAttachments(demand.getId(), request.getAttachments());
        syncTags(demand.getId(), request.getTagIds());

        return buildDetailVO(demand);
    }

    @Override
    public Page<DemandVO> pageList(DemandPageRequest request) {
        List<Long> tagScopeIds = resolveTagScopeIds(request.getTagId());
        if (request.getTagId() != null && tagScopeIds != null && tagScopeIds.isEmpty()) {
            return emptyPage(request);
        }
        return pageListByMysql(request, tagScopeIds);
    }

    @Override
    public Page<DemandVO> minePageList(Long memberId, DemandPageRequest request) {
        QueryWrapper<SupplyDemand> wrapper = new QueryWrapper<SupplyDemand>()
                .select("id", "member_id", "type", "title", "summary", "province",
                        "budget_min", "budget_max", "deadline", "view_count", "audit_status", "created_at")
                .eq("member_id", memberId)
                .eq(request.getAuditStatus() != null, "audit_status", request.getAuditStatus())
                .eq(StringUtils.hasText(request.getType()), "type", request.getType())
                .and(StringUtils.hasText(request.getKeyword()), q -> q
                        .like("title", request.getKeyword())
                        .or().like("summary", request.getKeyword()))
                .orderByDesc("created_at");

        Page<SupplyDemand> dbPage = demandMapper.selectPage(
                new Page<>(request.getPage(), request.getSize()), wrapper);

        Page<DemandVO> voPage = new Page<>(dbPage.getCurrent(), dbPage.getSize(), dbPage.getTotal());
        voPage.setRecords(dbPage.getRecords().stream().map(this::toVO).toList());
        return voPage;
    }

    @Override
    public DemandDetailVO getById(Long id) {
        SupplyDemand demand = demandMapper.selectById(id);
        if (demand == null) {
            throw new BizException(ResultCode.DEMAND_NOT_FOUND);
        }
        if (viewCountHelper != null) {
            viewCountHelper.incrementDemand(id);
        }
        return buildDetailVO(demand);
    }

    @Override
    @Transactional
    public DemandDetailVO update(Long id, UpdateDemandRequest request, Long accountId) {
        SupplyDemand demand = getOwnDemand(id, accountId);
        // 已关闭的需求不允许编辑，须重新发布而非静默重入审核队列
        if (Integer.valueOf(AuditStatus.OFFLINE.getCode()).equals(demand.getAuditStatus())) {
            throw new BizException(ResultCode.DEMAND_AUDIT_INVALID_STATUS, "已关闭的需求不能编辑");
        }

        if (request.getType() != null) demand.setType(request.getType());
        if (request.getTitle() != null) demand.setTitle(request.getTitle());
        if (request.getContent() != null) demand.setContent(HtmlSanitizerUtil.sanitize(request.getContent()));
        if (request.getSummary() != null) demand.setSummary(request.getSummary());
        if (request.getProvince() != null) demand.setProvince(request.getProvince());
        if (request.getBudgetMin() != null) demand.setBudgetMin(request.getBudgetMin());
        if (request.getBudgetMax() != null) demand.setBudgetMax(request.getBudgetMax());
        if (request.getDeadline() != null) demand.setDeadline(request.getDeadline());
        if (request.getCooperationMode() != null) demand.setCooperationMode(request.getCooperationMode());

        demand.setAuditStatus(AuditStatus.PENDING.getCode());
        demand.setAuditRemark(null);

        demandMapper.updateById(demand);
        log.info("更新需求 id={} accountId={}", id, accountId);

        if (request.getAttachments() != null) {
            replaceAttachments(id, request.getAttachments());
        }
        if (request.getTagIds() != null) {
            syncTags(id, request.getTagIds());
        }

        return buildDetailVO(demand);
    }

    @Override
    @Transactional
    public void delete(Long id, Long accountId) {
        getOwnDemand(id, accountId);
        demandMapper.deleteById(id);
        attachmentMapper.delete(new LambdaQueryWrapper<SupplyAttachment>()
                .eq(SupplyAttachment::getBizType, BIZ_TYPE)
                .eq(SupplyAttachment::getBizId, id));
        log.info("删除需求 id={} accountId={}", id, accountId);
        if (tagRelationClient != null) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        tagRelationClient.deleteByBiz(BIZ_TYPE, id);
                    } catch (Exception e) {
                        log.warn("删除需求标签关联失败 demandId={}，tag_relation 表存在孤立记录", id, e);
                    }
                }
            });
        }
    }

    @Override
    @Transactional
    public void close(Long id, Long accountId) {
        SupplyDemand demand = getOwnDemand(id, accountId);
        if (!Integer.valueOf(AuditStatus.APPROVED.getCode()).equals(demand.getAuditStatus())) {
            throw new BizException(ResultCode.DEMAND_AUDIT_INVALID_STATUS, "仅已发布的需求可以关闭");
        }
        demand.setAuditStatus(AuditStatus.OFFLINE.getCode());
        demandMapper.updateById(demand);
        log.info("关闭需求 id={} accountId={}", id, accountId);
    }

    // -------- private helpers --------

    private SupplyDemand getOwnDemand(Long id, Long accountId) {
        SupplyDemand demand = demandMapper.selectById(id);
        if (demand == null) {
            throw new BizException(ResultCode.DEMAND_NOT_FOUND);
        }
        // null accountId 视为未授权，而非静默放行
        if (accountId == null || !accountId.equals(demand.getAccountId())) {
            throw new BizException(ResultCode.PERMISSION_DENIED);
        }
        return demand;
    }

    private Page<DemandVO> pageListByMysql(DemandPageRequest request, List<Long> scopeIds) {
        QueryWrapper<SupplyDemand> wrapper = new QueryWrapper<SupplyDemand>()
                .select("id", "member_id", "type", "title", "summary", "province",
                        "budget_min", "budget_max", "deadline", "view_count", "audit_status", "created_at")
                .eq("audit_status", AuditStatus.APPROVED.getCode())
                .eq(StringUtils.hasText(request.getType()), "type", request.getType())
                .eq(StringUtils.hasText(request.getProvince()), "province", request.getProvince())
                .eq(request.getMemberId() != null, "member_id", request.getMemberId())
                .and(StringUtils.hasText(request.getKeyword()), q -> q
                        .like("title", request.getKeyword())
                        .or().like("summary", request.getKeyword()))
                .orderByDesc("created_at");

        if (!CollectionUtils.isEmpty(scopeIds)) {
            wrapper.in("id", scopeIds);
        }

        Page<SupplyDemand> dbPage = demandMapper.selectPage(
                new Page<>(request.getPage(), request.getSize()), wrapper);

        Page<DemandVO> voPage = new Page<>(dbPage.getCurrent(), dbPage.getSize(), dbPage.getTotal());
        voPage.setRecords(dbPage.getRecords().stream().map(this::toVO).toList());
        return voPage;
    }

    private List<Long> resolveTagScopeIds(Long tagId) {
        if (tagId == null || tagRelationClient == null) return null;
        try {
            Result<List<Long>> result = tagRelationClient.getBizIdsByTag(tagId, BIZ_TYPE);
            return result != null && result.getData() != null ? result.getData() : Collections.emptyList();
        } catch (Exception e) {
            log.warn("获取标签需求 ID 失败 tagId={}，tagId 过滤已忽略", tagId, e);
            return null;
        }
    }

    private Page<DemandVO> emptyPage(DemandPageRequest request) {
        Page<DemandVO> empty = new Page<>(request.getPage(), request.getSize(), 0);
        empty.setRecords(Collections.emptyList());
        return empty;
    }

    private void saveAttachments(Long demandId, List<AttachmentDTO> attachments) {
        if (CollectionUtils.isEmpty(attachments)) return;
        List<SupplyAttachment> entities = new java.util.ArrayList<>(attachments.size());
        for (int i = 0; i < attachments.size(); i++) {
            AttachmentDTO dto = attachments.get(i);
            SupplyAttachment att = new SupplyAttachment();
            att.setBizType(BIZ_TYPE);
            att.setBizId(demandId);
            att.setFileName(dto.getFileName());
            att.setFileUrl(dto.getFileUrl());
            att.setFileSize(dto.getFileSize());
            att.setFileType(dto.getFileType());
            att.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : i);
            entities.add(att);
        }
        attachmentMapper.batchInsert(entities);
    }

    private void replaceAttachments(Long demandId, List<AttachmentDTO> attachments) {
        attachmentMapper.delete(new LambdaQueryWrapper<SupplyAttachment>()
                .eq(SupplyAttachment::getBizType, BIZ_TYPE)
                .eq(SupplyAttachment::getBizId, demandId));
        saveAttachments(demandId, attachments);
    }

    private void syncTags(Long demandId, List<Long> tagIds) {
        if (tagRelationClient == null) return;
        Map<String, Object> req = new HashMap<>();
        req.put("bizType", BIZ_TYPE);
        req.put("bizId", demandId);
        req.put("tagIds", tagIds != null ? tagIds : Collections.emptyList());
        try {
            tagRelationClient.batchSet(req);
        } catch (Exception e) {
            log.warn("标签同步失败 demandId={}", demandId, e);
        }
    }

    private List<TagSimpleVO> getTagsByDemand(Long demandId) {
        if (tagRelationClient == null) return Collections.emptyList();
        try {
            Result<List<TagSimpleVO>> result = tagRelationClient.getByBiz(BIZ_TYPE, demandId);
            return result != null && result.getData() != null ? result.getData() : Collections.emptyList();
        } catch (Exception e) {
            log.warn("获取标签失败 demandId={}", demandId, e);
            return Collections.emptyList();
        }
    }

    private List<AttachmentVO> getAttachments(Long demandId) {
        List<SupplyAttachment> list = attachmentMapper.selectList(
                new LambdaQueryWrapper<SupplyAttachment>()
                        .eq(SupplyAttachment::getBizType, BIZ_TYPE)
                        .eq(SupplyAttachment::getBizId, demandId)
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

    private DemandDetailVO buildDetailVO(SupplyDemand d) {
        DemandDetailVO vo = new DemandDetailVO();
        vo.setId(d.getId());
        vo.setMemberId(d.getMemberId());
        vo.setAccountId(d.getAccountId());
        vo.setType(d.getType());
        vo.setTitle(d.getTitle());
        vo.setContent(d.getContent());
        vo.setSummary(d.getSummary());
        vo.setProvince(d.getProvince());
        vo.setBudgetMin(d.getBudgetMin());
        vo.setBudgetMax(d.getBudgetMax());
        vo.setDeadline(d.getDeadline());
        vo.setCooperationMode(d.getCooperationMode());
        vo.setViewCount(d.getViewCount() != null ? d.getViewCount() : 0);
        vo.setAuditStatus(d.getAuditStatus());
        vo.setAuditRemark(d.getAuditRemark());
        vo.setAuditorId(d.getAuditorId());
        vo.setAuditedAt(d.getAuditedAt());
        vo.setCreatedAt(d.getCreatedAt());
        vo.setUpdatedAt(d.getUpdatedAt());
        if (d.getId() != null) {
            vo.setAttachments(getAttachments(d.getId()));
            vo.setTags(getTagsByDemand(d.getId()));
        }
        return vo;
    }

    private DemandVO toVO(SupplyDemand d) {
        DemandVO vo = new DemandVO();
        vo.setId(d.getId());
        vo.setMemberId(d.getMemberId());
        vo.setType(d.getType());
        vo.setTitle(d.getTitle());
        vo.setSummary(d.getSummary());
        vo.setProvince(d.getProvince());
        vo.setBudgetMin(d.getBudgetMin());
        vo.setBudgetMax(d.getBudgetMax());
        vo.setDeadline(d.getDeadline());
        vo.setViewCount(d.getViewCount() != null ? d.getViewCount() : 0);
        vo.setAuditStatus(d.getAuditStatus());
        vo.setCreatedAt(d.getCreatedAt());
        return vo;
    }

    // -------- 管理端审核 --------

    @Override
    public Page<AdminDemandVO> adminPageList(AdminDemandPageRequest request) {
        QueryWrapper<SupplyDemand> wrapper = new QueryWrapper<SupplyDemand>()
                .select("id", "member_id", "account_id", "type", "title", "summary",
                        "province", "budget_min", "budget_max", "deadline", "view_count",
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

        Page<SupplyDemand> dbPage = demandMapper.selectPage(
                new Page<>(request.getPage(), request.getSize()), wrapper);

        Page<AdminDemandVO> voPage = new Page<>(dbPage.getCurrent(), dbPage.getSize(), dbPage.getTotal());
        voPage.setRecords(dbPage.getRecords().stream().map(this::toAdminVO).toList());
        return voPage;
    }

    @Override
    @Transactional
    public void approve(Long id, Long auditorId) {
        SupplyDemand demand = demandMapper.selectById(id);
        if (demand == null) {
            throw new BizException(ResultCode.DEMAND_NOT_FOUND);
        }
        if (!Integer.valueOf(AuditStatus.PENDING.getCode()).equals(demand.getAuditStatus())) {
            throw new BizException(ResultCode.DEMAND_AUDIT_INVALID_STATUS);
        }
        demand.setAuditStatus(AuditStatus.APPROVED.getCode());
        demand.setAuditorId(auditorId);
        demand.setAuditedAt(LocalDateTime.now());
        demand.setAuditRemark(null);
        demandMapper.updateById(demand);
        log.info("审核通过需求 id={} auditorId={}", id, auditorId);
        sendEsSaveEvent(demand);
    }

    @Override
    @Transactional
    public void reject(Long id, Long auditorId, String remark) {
        SupplyDemand demand = demandMapper.selectById(id);
        if (demand == null) {
            throw new BizException(ResultCode.DEMAND_NOT_FOUND);
        }
        if (!Integer.valueOf(AuditStatus.PENDING.getCode()).equals(demand.getAuditStatus())) {
            throw new BizException(ResultCode.DEMAND_AUDIT_INVALID_STATUS);
        }
        demand.setAuditStatus(AuditStatus.REJECTED.getCode());
        demand.setAuditorId(auditorId);
        demand.setAuditedAt(LocalDateTime.now());
        demand.setAuditRemark(remark);
        demandMapper.updateById(demand);
        log.info("审核拒绝需求 id={} auditorId={} remark={}", id, auditorId, remark);
    }

    @Override
    public BatchAuditResultVO batchApprove(List<Long> ids, Long auditorId) {
        BatchAuditResultVO result = new BatchAuditResultVO();
        result.setTotal(ids.size());
        for (Long id : ids) {
            try {
                approve(id, auditorId);
                result.addSuccess();
            } catch (BizException e) {
                result.addError(id, e.getMessage());
            }
        }
        log.info("批量审核通过需求 total={} success={} failed={} auditorId={}",
                result.getTotal(), result.getSuccess(), result.getFailed(), auditorId);
        return result;
    }

    @Override
    public BatchAuditResultVO batchReject(List<Long> ids, Long auditorId, String remark) {
        BatchAuditResultVO result = new BatchAuditResultVO();
        result.setTotal(ids.size());
        for (Long id : ids) {
            try {
                reject(id, auditorId, remark);
                result.addSuccess();
            } catch (BizException e) {
                result.addError(id, e.getMessage());
            }
        }
        log.info("批量审核拒绝需求 total={} success={} failed={} auditorId={}",
                result.getTotal(), result.getSuccess(), result.getFailed(), auditorId);
        return result;
    }

    @Override
    @Transactional
    public void adminOffline(Long id, Long auditorId) {
        SupplyDemand demand = demandMapper.selectById(id);
        if (demand == null) {
            throw new BizException(ResultCode.DEMAND_NOT_FOUND);
        }
        if (!Integer.valueOf(AuditStatus.APPROVED.getCode()).equals(demand.getAuditStatus())) {
            throw new BizException(ResultCode.DEMAND_AUDIT_INVALID_STATUS);
        }
        demand.setAuditStatus(AuditStatus.OFFLINE.getCode());
        demand.setAuditorId(auditorId);
        demand.setAuditedAt(LocalDateTime.now());
        demandMapper.updateById(demand);
        log.info("管理端下架需求 id={} auditorId={}", id, auditorId);
        sendEsDeleteEvent(id);
    }

    @Override
    public List<SupplyBriefVO> batchBrief(List<Long> ids) {
        if (CollectionUtils.isEmpty(ids)) {
            return Collections.emptyList();
        }
        QueryWrapper<SupplyDemand> qw = new QueryWrapper<SupplyDemand>()
                .select("id", "member_id", "province", "type", "audit_status", "title", "summary")
                .in("id", ids)
                .eq("is_deleted", 0);
        return demandMapper.selectList(qw).stream().map(d -> {
            SupplyBriefVO vo = new SupplyBriefVO();
            vo.setId(d.getId());
            vo.setMemberId(d.getMemberId());
            vo.setProvince(d.getProvince());
            vo.setType(d.getType());
            vo.setAuditStatus(d.getAuditStatus());
            vo.setTitle(d.getTitle());
            vo.setSummary(d.getSummary());
            return vo;
        }).toList();
    }

    private AdminDemandVO toAdminVO(SupplyDemand d) {
        AdminDemandVO vo = new AdminDemandVO();
        vo.setId(d.getId());
        vo.setMemberId(d.getMemberId());
        vo.setAccountId(d.getAccountId());
        vo.setType(d.getType());
        vo.setTitle(d.getTitle());
        vo.setSummary(d.getSummary());
        vo.setProvince(d.getProvince());
        vo.setBudgetMin(d.getBudgetMin());
        vo.setBudgetMax(d.getBudgetMax());
        vo.setDeadline(d.getDeadline());
        vo.setViewCount(d.getViewCount() != null ? d.getViewCount() : 0);
        vo.setAuditStatus(d.getAuditStatus());
        vo.setAuditRemark(d.getAuditRemark());
        vo.setAuditorId(d.getAuditorId());
        vo.setAuditedAt(d.getAuditedAt());
        vo.setCreatedAt(d.getCreatedAt());
        vo.setTags(getTagsByDemand(d.getId()));
        return vo;
    }

    // -------- ES 同步 --------

    private void sendEsSaveEvent(SupplyDemand demand) {
        if (demandEsSyncService == null) return;
        Long demandId = demand.getId();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    List<String> tagNames = fetchTagNames(demandId);
                    demandEsSyncService.syncSave(demand, tagNames);
                } catch (Exception e) {
                    log.warn("需求 ES 同步失败 demandId={}", demandId, e);
                }
            }
        });
    }

    private void sendEsDeleteEvent(Long demandId) {
        if (demandEsSyncService == null) return;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    demandEsSyncService.syncDelete(demandId);
                } catch (Exception e) {
                    log.warn("需求 ES 删除失败 demandId={}", demandId, e);
                }
            }
        });
    }

    private List<String> fetchTagNames(Long demandId) {
        if (tagRelationClient == null) return Collections.emptyList();
        try {
            Result<List<TagSimpleVO>> result = tagRelationClient.getByBiz(BIZ_TYPE, demandId);
            if (result == null || result.getData() == null) return Collections.emptyList();
            return result.getData().stream().map(TagSimpleVO::getName).toList();
        } catch (Exception e) {
            log.warn("ES 同步时获取需求标签失败 demandId={}", demandId, e);
            return Collections.emptyList();
        }
    }
}
