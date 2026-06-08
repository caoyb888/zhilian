package com.greenlink.glmatch.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MatchStatusUpdateVO {

    private Long recordId;
    private Long resourceId;
    private Long demandId;
    /** 更新后的状态：3洽谈中 / 5已完成 / 7已撤销 */
    private Integer status;
    private LocalDateTime updatedAt;
}
