package com.greenlink.glmatch.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class MatchRecordItemVO {

    private Long recordId;
    private Long resourceId;
    private Long demandId;
    private String resourceTitle;
    private String demandTitle;
    /** 对方（非调用方）的会员简要信息 */
    private CounterpartyVO counterparty;
    private BigDecimal matchScore;
    /** 1系统推荐 2主动申请 */
    private Integer matchType;
    /** 1待响应 2已接受 3洽谈中 5已完成 6已拒绝 7已撤销 */
    private Integer status;
    private String applyMessage;
    /** 当前登录方是否为发起方 */
    private Boolean isInitiator;
    /** 当前账号在该对接中的未读消息数 */
    private Integer unreadCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class CounterpartyVO {
        private Long memberId;
        private String name;
        private Integer memberLevel;
        private String province;
    }
}
