package com.greenlink.glportal.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ActivityStatusUpdateRequest {

    @NotNull(message = "状态不能为空")
    @Min(1) @Max(5)
    private Integer status;
}
