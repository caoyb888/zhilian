package com.greenlink.glmatch.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.mq.MatchEventMessage;
import com.greenlink.glmatch.domain.MatchRecord;
import com.greenlink.glmatch.dto.request.MatchRespondRequest;
import com.greenlink.glmatch.dto.response.MatchRespondVO;
import com.greenlink.glmatch.mq.MatchEventProducer;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import com.greenlink.glmatch.service.MatchRespondService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchRespondServiceImpl implements MatchRespondService {

    /** status 常量 */
    private static final int STATUS_PENDING  = 1;
    private static final int STATUS_ACCEPTED = 2;
    private static final int STATUS_REJECTED = 6;

    /** 错误码 */
    private static final int CODE_NOT_FOUND        = 3001;
    private static final int CODE_ILLEGAL_TRANSIT  = 3103;

    private final MatchRecordMapper matchRecordMapper;
    private final MatchEventProducer matchEventProducer;

    @Override
    @Transactional
    public MatchRespondVO respond(Long recordId, Long accountId, Long memberId, MatchRespondRequest req) {
        // ── 1. 加载记录 ──
        MatchRecord record = matchRecordMapper.selectById(recordId);
        if (record == null) {
            throw new BizException(CODE_NOT_FOUND, "对接记录不存在");
        }

        // ── 2. 权限：调用方必须是对接双方之一 ──
        boolean isParty = memberId.equals(record.getResourceMemberId())
                || memberId.equals(record.getDemandMemberId());
        if (!isParty) {
            throw new BizException(1003, "无权操作该对接记录");
        }

        // ── 3. 权限：发起方不能自己响应 ──
        if (accountId.equals(record.getInitiatorId())) {
            throw new BizException(1003, "发起方不能响应自己的申请");
        }

        // ── 4. 状态机：仅 status=1 可响应，否则返回 3103 ──
        if (record.getStatus() != STATUS_PENDING) {
            throw new BizException(CODE_ILLEGAL_TRANSIT,
                    "当前状态（" + record.getStatus() + "）不允许执行响应操作，仅待响应（1）状态可接受或拒绝");
        }

        // ── 5. 计算目标状态 ──
        int targetStatus = "ACCEPT".equals(req.getAction()) ? STATUS_ACCEPTED : STATUS_REJECTED;

        // ── 6. 更新 ──
        LocalDateTime now = LocalDateTime.now();
        UpdateWrapper<MatchRecord> wrapper = new UpdateWrapper<>();
        wrapper.eq("id", recordId)
                .eq("status", STATUS_PENDING)   // 乐观并发：防止并发响应
                .set("status", targetStatus)
                .set("updated_at", now);
        int rows = matchRecordMapper.update(null, wrapper);
        if (rows == 0) {
            // 极小概率：并发情况下另一方抢先响应
            throw new BizException(CODE_ILLEGAL_TRANSIT, "对接记录已被处理，请刷新后重试");
        }

        log.info("对接申请已响应 recordId={} action={} newStatus={} respondentMemberId={}",
                recordId, req.getAction(), targetStatus, memberId);

        String eventType = "ACCEPT".equals(req.getAction())
                ? MatchEventMessage.EventType.MATCH_ACCEPTED.name()
                : MatchEventMessage.EventType.MATCH_REJECTED.name();
        matchEventProducer.publish(MatchEventMessage.builder()
                .eventType(eventType)
                .matchId(recordId)
                .resourceId(record.getResourceId())
                .demandId(record.getDemandId())
                .resourceMemberId(record.getResourceMemberId())
                .demandMemberId(record.getDemandMemberId())
                .actorAccountId(accountId)
                .actorMemberId(memberId)
                .initiatorAccountId(record.getInitiatorId())
                .build());

        return MatchRespondVO.builder()
                .recordId(recordId)
                .resourceId(record.getResourceId())
                .demandId(record.getDemandId())
                .status(targetStatus)
                .updatedAt(now)
                .build();
    }
}
