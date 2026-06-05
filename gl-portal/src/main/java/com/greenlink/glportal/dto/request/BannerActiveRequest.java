package com.greenlink.glportal.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BannerActiveRequest {

    @NotNull(message = "启用状态不能为空")
    private Integer isActive;   // 0禁用 1启用
}
