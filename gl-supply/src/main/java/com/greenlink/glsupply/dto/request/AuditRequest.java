package com.greenlink.glsupply.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AuditRequest {

    @Size(max = 500, message = "审核备注不超过500字")
    private String remark;
}
