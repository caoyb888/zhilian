package com.greenlink.glsupply.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AuditRequest {

    @NotBlank(message = "审核拒绝时必须填写原因")
    @Size(max = 500, message = "审核备注不超过500字")
    private String remark;
}
