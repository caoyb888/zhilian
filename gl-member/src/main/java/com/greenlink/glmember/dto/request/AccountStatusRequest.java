package com.greenlink.glmember.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AccountStatusRequest {

    @NotNull(message = "状态不能为空")
    private Integer status;
}
