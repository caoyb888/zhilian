package com.greenlink.glmatch.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.glmatch.domain.MatchRecord;
import com.greenlink.glmatch.dto.request.MatchStatusUpdateRequest;
import com.greenlink.glmatch.dto.response.MatchStatusUpdateVO;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import com.greenlink.glmatch.service.MatchStatusUpdateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchStatusUpdateServiceImpl implements MatchStatusUpdateService {

    private static final int STATUS_PENDING     = 1;
    private static final int STATUS_ACCEPTED    = 2;
    private static final int STATUS_NEGOTIATING = 3;
    private static final int STATUS_COMPLETED   = 5;
    private static final int STATUS_CANCELLED   = 7;

    private static final int CODE_NOT_FOUND       = 3001;
    private static final int CODE_ILLEGAL_TRANSIT = 3103;

    private final MatchRecordMapper matchRecordMapper;

    @Override
    @Transactional
    public MatchStatusUpdateVO update(Long recordId, Long accountId, Long memberId,
                                      MatchStatusUpdateRequest req) {
        // ── 1. 加载记录 ──
        MatchRecord record = matchRecordMapper.selectById(recordId);
        if (record == null) {
            throw new BizException(CODE_NOT_FOUND, "对接记录不存在");
        }

        // ── 2. 调用方必须是对接双方之一 ──
        boolean isParty = memberId.equals(record.getResourceMemberId())
                || memberId.equals(record.getDemandMemberId());
        if (!isParty) {
            throw new BizException(1003, "无权操作该对接记录");
        }

        int currentStatus = record.getStatus();
        int targetStatus  = resolveTargetStatus(req.getAction(), currentStatus, accountId, record);

        // ── 3. 更新（乐观并发：以 status 为条件防并发冲突）──
        LocalDateTime now = LocalDateTime.now();
        UpdateWrapper<MatchRecord> wrapper = new UpdateWrapper<>();
        wrapper.eq("id", recordId)
                .eq("status", currentStatus)
                .set("status", targetStatus)
                .set("updated_at", now);
        int rows = matchRecordMapper.update(null, wrapper);
        if (rows == 0) {
            throw new BizException(CODE_ILLEGAL_TRANSIT, "对接记录状态已变更，请刷新后重试");
        }

        log.info("对接状态更新 recordId={} action={} {} → {} operatorMemberId={}",
                recordId, req.getAction(), currentStatus, targetStatus, memberId);

        return MatchStatusUpdateVO.builder()
                .recordId(recordId)
                .resourceId(record.getResourceId())
                .demandId(record.getDemandId())
                .status(targetStatus)
                .updatedAt(now)
                .build();
    }

    /**
     * 根据 action 与当前状态计算目标状态，不合法时抛 3103。
     * CANCEL 从 status=1 撤回时额外校验操作方必须是发起方。
     */
    private int resolveTargetStatus(String action, int current, Long accountId, MatchRecord record) {
        return switch (action) {
            case "NEGOTIATE" -> {
                if (current != STATUS_ACCEPTED) {
                    throw new BizException(CODE_ILLEGAL_TRANSIT,
                            "进入洽谈仅允许从已接受（2）状态流转，当前状态：" + current);
                }
                yield STATUS_NEGOTIATING;
            }
            case "COMPLETE" -> {
                if (!Set.of(STATUS_ACCEPTED, STATUS_NEGOTIATING).contains(current)) {
                    throw new BizException(CODE_ILLEGAL_TRANSIT,
                            "标记完成仅允许从已接受（2）或洽谈中（3）状态流转，当前状态：" + current);
                }
                yield STATUS_COMPLETED;
            }
            case "CANCEL" -> {
                if (!Set.of(STATUS_PENDING, STATUS_ACCEPTED, STATUS_NEGOTIATING).contains(current)) {
                    throw new BizException(CODE_ILLEGAL_TRANSIT,
                            "撤销仅允许从待响应（1）、已接受（2）或洽谈中（3）状态流转，当前状态：" + current);
                }
                // 待响应阶段仅发起方可撤回
                if (current == STATUS_PENDING && !accountId.equals(record.getInitiatorId())) {
                    throw new BizException(1003, "待响应阶段仅发起方可撤回申请");
                }
                yield STATUS_CANCELLED;
            }
            default -> throw new BizException(CODE_ILLEGAL_TRANSIT, "不支持的操作：" + action);
        };
    }
}
