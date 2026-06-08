package com.greenlink.glmatch.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class MatchRespondRequest {

    /** ACCEPT（接受）或 REJECT（拒绝） */
    @NotNull(message = "action 不能为空")
    @Pattern(regexp = "ACCEPT|REJECT", message = "action 必须为 ACCEPT 或 REJECT")
    private String action;
}
