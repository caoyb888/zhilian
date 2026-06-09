package com.greenlink.glmessage.service.impl;

import com.greenlink.common.mq.MatchEventMessage;
import com.greenlink.common.result.Result;
import com.greenlink.glmessage.domain.MessageNotification;
import com.greenlink.glmessage.feign.MemberInternalClient;
import com.greenlink.glmessage.repository.MessageNotificationMapper;
import com.greenlink.glmessage.service.SiteNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SiteNotificationServiceImpl implements SiteNotificationService {

    private final MessageNotificationMapper notificationMapper;
    private final MemberInternalClient memberInternalClient;

    @Override
    public void createFromMatchEvent(MatchEventMessage event) {
        List<MessageNotification> notifications = buildNotifications(event);
        for (MessageNotification n : notifications) {
            notificationMapper.insert(n);
        }
        log.info("站内信已生成 eventType={} matchId={} count={}",
                event.getEventType(), event.getMatchId(), notifications.size());
    }

    // ─── 通知构建 ────────────────────────────────────────────────────────────

    private List<MessageNotification> buildNotifications(MatchEventMessage event) {
        List<MessageNotification> list = new ArrayList<>();
        String type = event.getEventType();

        switch (type) {
            case "MATCH_APPLIED" -> {
                // 通知被申请方（非 actorMemberId 的另一方主账号）
                Long targetMemberId = counterpartyMemberId(event);
                Long toAccountId = lookupMainAccountId(targetMemberId);
                if (toAccountId != null) {
                    list.add(build(toAccountId, event.getMatchId(),
                            "【新对接申请】",
                            "您收到一条新的对接申请，资源：" + safe(event.getResourceTitle())
                                    + "，需求：" + safe(event.getDemandTitle())));
                }
            }
            case "MATCH_ACCEPTED" -> {
                // 通知发起方（initiatorAccountId 已在事件中）
                if (event.getInitiatorAccountId() != null) {
                    list.add(build(event.getInitiatorAccountId(), event.getMatchId(),
                            "【申请已接受】",
                            "您的对接申请已被接受，可开始进一步洽谈。资源：" + safe(event.getResourceTitle())));
                }
            }
            case "MATCH_REJECTED" -> {
                // 通知发起方
                if (event.getInitiatorAccountId() != null) {
                    list.add(build(event.getInitiatorAccountId(), event.getMatchId(),
                            "【申请已拒绝】",
                            "您的对接申请已被拒绝，资源：" + safe(event.getResourceTitle())));
                }
            }
            case "MATCH_COMPLETED" -> {
                // 通知双方主账号
                Map<Long, Long> accountMap = batchLookupMainAccountIds(
                        List.of(event.getResourceMemberId(), event.getDemandMemberId()));
                accountMap.values().forEach(accountId ->
                        list.add(build(accountId, event.getMatchId(),
                                "【对接已完成】",
                                "您参与的对接已成功完成，资源：" + safe(event.getResourceTitle()))));
            }
            case "MATCH_CANCELLED" -> {
                // 通知对方主账号
                Long targetMemberId = counterpartyMemberId(event);
                Long toAccountId = lookupMainAccountId(targetMemberId);
                if (toAccountId != null) {
                    list.add(build(toAccountId, event.getMatchId(),
                            "【对接已撤销】",
                            "对方已撤销对接申请，资源：" + safe(event.getResourceTitle())));
                }
            }
            default -> log.warn("未知事件类型 eventType={}", type);
        }
        return list;
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    /** 返回非操作方的 memberId（即对方会员ID）。 */
    private Long counterpartyMemberId(MatchEventMessage event) {
        if (event.getActorMemberId() == null) return event.getDemandMemberId();
        return event.getActorMemberId().equals(event.getResourceMemberId())
                ? event.getDemandMemberId()
                : event.getResourceMemberId();
    }

    private MessageNotification build(Long accountId, Long matchId, String title, String content) {
        MessageNotification n = new MessageNotification();
        n.setAccountId(accountId);
        n.setBizType("MATCH");
        n.setBizId(matchId);
        n.setTitle(title);
        n.setContent(content);
        n.setChannel("SITE");
        n.setIsRead(0);
        n.setSendStatus(1);
        n.setSendAt(LocalDateTime.now());
        n.setCreatedAt(LocalDateTime.now());
        return n;
    }

    private Long lookupMainAccountId(Long memberId) {
        Map<Long, Long> map = batchLookupMainAccountIds(List.of(memberId));
        return map.get(memberId);
    }

    private Map<Long, Long> batchLookupMainAccountIds(List<Long> memberIds) {
        try {
            Result<Map<Long, Long>> result = memberInternalClient.getMainAccountIds(memberIds);
            if (result != null && result.getData() != null) return result.getData();
        } catch (Exception e) {
            log.warn("查询主账号ID失败 memberIds={}", memberIds, e);
        }
        return Collections.emptyMap();
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }
}
