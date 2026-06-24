package com.greenlink.glmatch.service.impl;

import com.greenlink.common.exception.BizException;
import com.greenlink.common.mq.MatchEventMessage;
import com.greenlink.common.result.Result;
import com.greenlink.glmatch.domain.MatchRecord;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import com.greenlink.glmatch.dto.request.BatchMatchApplyRequest;
import com.greenlink.glmatch.dto.request.MatchApplyRequest;
import com.greenlink.glmatch.dto.response.BatchMatchApplyVO;
import com.greenlink.glmatch.dto.response.MatchApplyVO;
import com.greenlink.glmatch.feign.SupplyClient;
import com.greenlink.glmatch.mq.MatchEventProducer;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import com.greenlink.glmatch.service.MatchApplyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchApplyServiceImpl implements MatchApplyService {

    /** 错误码：资源/需求不存在 */
    private static final int CODE_NOT_FOUND = 3001;
    /** 错误码：重复对接（已有进行中记录） */
    private static final int CODE_DUPLICATE = 3102;

    /** match_type：主动申请 */
    private static final int MATCH_TYPE_MANUAL = 2;
    /** status：待响应 */
    private static final int STATUS_PENDING = 1;

    private final SupplyClient supplyClient;
    private final MatchRecordMapper matchRecordMapper;
    private final MatchEventProducer matchEventProducer;

    @Override
    @Transactional
    public MatchApplyVO apply(Long accountId, Long memberId, MatchApplyRequest req) {
        // ── 1. 拉取资源/需求简要信息，校验存在 ──
        SupplyBriefDTO resource = fetchBrief("RESOURCE", req.getResourceId());
        if (resource == null) {
            throw new BizException(CODE_NOT_FOUND, "资源不存在或已下架");
        }
        SupplyBriefDTO demand = fetchBrief("DEMAND", req.getDemandId());
        if (demand == null) {
            throw new BizException(CODE_NOT_FOUND, "需求不存在或已关闭");
        }

        // ── 2. 调用方归属校验：必须是资源方或需求方之一 ──
        boolean isResourceOwner = memberId.equals(resource.getMemberId());
        boolean isDemandOwner = memberId.equals(demand.getMemberId());
        if (!isResourceOwner && !isDemandOwner) {
            throw new BizException(1003, "无权发起该对接申请");
        }

        // ── 3. 自对接防护：资源方与需求方不能是同一会员 ──
        if (resource.getMemberId().equals(demand.getMemberId())) {
            throw new BizException(3101, "不能向自己发起对接申请");
        }

        // ── 4. 重复校验：同一 (resourceId, demandId) 对已有进行中记录 ──
        if (matchRecordMapper.existsActiveRecord(req.getResourceId(), req.getDemandId())) {
            throw new BizException(CODE_DUPLICATE, "已存在进行中的对接记录，不可重复申请");
        }

        // ── 5. 创建 match_record ──
        MatchRecord record = new MatchRecord();
        record.setResourceId(req.getResourceId());
        record.setDemandId(req.getDemandId());
        record.setResourceMemberId(resource.getMemberId());
        record.setDemandMemberId(demand.getMemberId());
        record.setMatchType(MATCH_TYPE_MANUAL);
        record.setStatus(STATUS_PENDING);
        record.setInitiatorId(accountId);
        record.setApplyMessage(req.getApplyMessage());
        // matchScore 主动申请不打分，留 null

        matchRecordMapper.insert(record);
        log.info("对接申请创建成功 recordId={} resourceId={} demandId={} initiatorAccountId={}",
                record.getId(), req.getResourceId(), req.getDemandId(), accountId);

        matchEventProducer.publish(MatchEventMessage.builder()
                .eventType(MatchEventMessage.EventType.MATCH_APPLIED.name())
                .matchId(record.getId())
                .resourceId(record.getResourceId())
                .demandId(record.getDemandId())
                .resourceMemberId(record.getResourceMemberId())
                .demandMemberId(record.getDemandMemberId())
                .actorAccountId(accountId)
                .actorMemberId(memberId)
                .resourceTitle(resource.getTitle())
                .demandTitle(demand.getTitle())
                .build());

        return MatchApplyVO.builder()
                .recordId(record.getId())
                .resourceId(record.getResourceId())
                .demandId(record.getDemandId())
                .resourceMemberId(record.getResourceMemberId())
                .demandMemberId(record.getDemandMemberId())
                .status(record.getStatus())
                .matchType(record.getMatchType())
                .applyMessage(record.getApplyMessage())
                .createdAt(record.getCreatedAt())
                .build();
    }

    @Override
    public BatchMatchApplyVO batchApply(Long accountId, Long memberId, BatchMatchApplyRequest req) {
        BatchMatchApplyVO result = new BatchMatchApplyVO();
        // 组装 (resourceId, demandId) 对
        if (req.getResourceId() != null && req.getDemandIds() != null) {
            for (Long demandId : req.getDemandIds()) {
                applyOne(accountId, memberId, req.getResourceId(), demandId, req.getApplyMessage(), result);
            }
        } else if (req.getDemandId() != null && req.getResourceIds() != null) {
            for (Long resourceId : req.getResourceIds()) {
                applyOne(accountId, memberId, resourceId, req.getDemandId(), req.getApplyMessage(), result);
            }
        } else {
            throw new BizException(1001, "参数不合法：需提供 resourceId+demandIds 或 demandId+resourceIds");
        }
        result.setTotal(result.getSuccess() + result.getFailed());
        log.info("批量对接申请 total={} success={} failed={} memberId={}",
                result.getTotal(), result.getSuccess(), result.getFailed(), memberId);
        return result;
    }

    private void applyOne(Long accountId, Long memberId, Long resourceId, Long demandId,
                          String applyMessage, BatchMatchApplyVO result) {
        MatchApplyRequest one = new MatchApplyRequest();
        one.setResourceId(resourceId);
        one.setDemandId(demandId);
        one.setApplyMessage(applyMessage);
        try {
            apply(accountId, memberId, one);
            result.addSuccess();
        } catch (BizException e) {
            result.addError("资源" + resourceId + "↔需求" + demandId + "：" + e.getMessage());
        }
    }

    private SupplyBriefDTO fetchBrief(String type, Long id) {
        try {
            Result<SupplyBriefDTO> result = "RESOURCE".equals(type)
                    ? supplyClient.getResourceMatchBrief(id)
                    : supplyClient.getDemandMatchBrief(id);
            if (result == null || result.getData() == null) return null;
            // 仅接受已审核通过（auditStatus=1）的资源/需求
            SupplyBriefDTO brief = result.getData();
            return Integer.valueOf(1).equals(brief.getAuditStatus()) ? brief : null;
        } catch (Exception e) {
            log.warn("获取 {} 简要失败 id={}", type, id, e);
            return null;
        }
    }
}
