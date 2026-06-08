package com.greenlink.glmatch.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MatchRespondVO {

    private Long recordId;
    private Long resourceId;
    private Long demandId;
    /** 更新后的状态：2已接受 / 6已拒绝 */
    private Integer status;
    private LocalDateTime updatedAt;
}
