package com.greenlink.glmatch.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MatchApplyVO {

    private Long recordId;
    private Long resourceId;
    private Long demandId;
    private Long resourceMemberId;
    private Long demandMemberId;
    /** 1待响应 */
    private Integer status;
    /** 2主动申请 */
    private Integer matchType;
    private String applyMessage;
    private LocalDateTime createdAt;
}
