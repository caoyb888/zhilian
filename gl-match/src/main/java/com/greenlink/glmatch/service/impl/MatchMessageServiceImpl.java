package com.greenlink.glmatch.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmatch.domain.MatchMessage;
import com.greenlink.glmatch.domain.MatchRecord;
import com.greenlink.glmatch.dto.request.SendMessageRequest;
import com.greenlink.glmatch.dto.response.MarkReadVO;
import com.greenlink.glmatch.dto.response.MatchMessageVO;
import com.greenlink.glmatch.repository.MatchMessageMapper;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import com.greenlink.glmatch.service.MatchMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchMessageServiceImpl implements MatchMessageService {

    /** 允许发送消息的对接状态：1待响应 2已接受 3洽谈中 */
    private static final java.util.Set<Integer> SENDABLE_STATUSES = java.util.Set.of(1, 2, 3);

    private final MatchRecordMapper matchRecordMapper;
    private final MatchMessageMapper matchMessageMapper;

    // ─── send ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public MatchMessageVO send(Long matchId, Long accountId, Long memberId, SendMessageRequest req) {
        MatchRecord record = loadAndCheckParty(matchId, memberId);

        if (!SENDABLE_STATUSES.contains(record.getStatus())) {
            throw new BizException(3103, "当前对接状态不允许发送消息（status=" + record.getStatus() + "）");
        }

        MatchMessage msg = new MatchMessage();
        msg.setMatchId(matchId);
        msg.setSenderId(accountId);
        msg.setMsgType(req.getMsgType());
        msg.setContent(req.getContent());
        msg.setAttachUrl(req.getAttachUrl());
        msg.setIsRead(0);
        msg.setCreatedAt(LocalDateTime.now());
        matchMessageMapper.insert(msg);

        log.info("对接消息已发送 matchId={} senderId={} msgId={}", matchId, accountId, msg.getId());
        return toVO(msg);
    }

    // ─── listMessages ────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PageResult<MatchMessageVO> listMessages(Long matchId, Long accountId, Long memberId,
                                                    int page, int size) {
        loadAndCheckParty(matchId, memberId);

        // 查询（ASC，适合聊天历史从旧到新展示）
        QueryWrapper<MatchMessage> qw = new QueryWrapper<>();
        qw.eq("match_id", matchId).orderByAsc("created_at");

        Page<MatchMessage> pageReq = new Page<>(page, size);
        Page<MatchMessage> result = matchMessageMapper.selectPage(pageReq, qw);

        // 读取时顺带将对方消息标为已读
        matchMessageMapper.markAllRead(matchId, accountId);

        List<MatchMessageVO> records = result.getRecords().stream()
                .map(this::toVO)
                .collect(Collectors.toList());

        return PageResult.of(records, result.getTotal(), page, size);
    }

    // ─── markAllRead ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public MarkReadVO markAllRead(Long matchId, Long accountId, Long memberId) {
        loadAndCheckParty(matchId, memberId);
        int count = matchMessageMapper.markAllRead(matchId, accountId);
        log.info("已读标记 matchId={} accountId={} markedCount={}", matchId, accountId, count);
        return new MarkReadVO(count);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private MatchRecord loadAndCheckParty(Long matchId, Long memberId) {
        MatchRecord record = matchRecordMapper.selectById(matchId);
        if (record == null) {
            throw new BizException(3001, "对接记录不存在");
        }
        boolean isParty = memberId.equals(record.getResourceMemberId())
                || memberId.equals(record.getDemandMemberId());
        if (!isParty) {
            throw new BizException(1003, "无权访问该对接记录");
        }
        return record;
    }

    private MatchMessageVO toVO(MatchMessage msg) {
        return MatchMessageVO.builder()
                .id(msg.getId())
                .matchId(msg.getMatchId())
                .senderId(msg.getSenderId())
                .msgType(msg.getMsgType())
                .content(msg.getContent())
                .attachUrl(msg.getAttachUrl())
                .isRead(msg.getIsRead())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
