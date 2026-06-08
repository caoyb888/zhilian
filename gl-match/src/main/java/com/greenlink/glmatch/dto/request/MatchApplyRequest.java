package com.greenlink.glmatch.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MatchApplyRequest {

    @NotNull(message = "resourceId 不能为空")
    private Long resourceId;

    @NotNull(message = "demandId 不能为空")
    private Long demandId;

    @Size(max = 1000, message = "申请留言不超过 1000 字")
    private String applyMessage;
}
