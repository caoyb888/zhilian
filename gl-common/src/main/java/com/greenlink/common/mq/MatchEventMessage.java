package com.greenlink.common.mq;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * gl-match → gl-message 的对接状态变更事件（RocketMQ 消息体）。
 * Topic: gl-match-event
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchEventMessage {

    public static final String TOPIC = "gl-match-event";

    /** 事件类型 */
    public enum EventType {
        MATCH_APPLIED,    // 发起申请
        MATCH_ACCEPTED,   // 申请被接受
        MATCH_REJECTED,   // 申请被拒绝
        MATCH_COMPLETED,  // 对接完成
        MATCH_CANCELLED   // 对接撤销
    }

    private String eventType;
    private Long matchId;
    private Long resourceId;
    private Long demandId;
    private Long resourceMemberId;
    private Long demandMemberId;
    /** 触发本次事件的账号ID */
    private Long actorAccountId;
    /** 触发本次事件的会员ID（用于判断对方是哪个 member）*/
    private Long actorMemberId;
    /** 对接记录的原始发起方账号ID（respond/status 变更场景中已知）*/
    private Long initiatorAccountId;
    private String resourceTitle;
    private String demandTitle;
}
