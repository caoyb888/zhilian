package com.greenlink.glmember.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MemberStatusRequest {

    @NotNull(message = "状态值不能为空")
    @Min(value = 0, message = "status 最小值为 0")
    @Max(value = 1, message = "管理端仅可设置 0禁用 或 1正常")
    private Integer status;
}
