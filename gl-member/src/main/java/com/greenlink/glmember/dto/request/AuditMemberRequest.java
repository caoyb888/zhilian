package com.greenlink.glmember.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AuditMemberRequest {

    @NotBlank(message = "审核动作不能为空")
    @Pattern(regexp = "APPROVE|REJECT", message = "action 只能为 APPROVE 或 REJECT")
    private String action;

    @Size(max = 500, message = "审核备注最多500字")
    private String remark;
}
