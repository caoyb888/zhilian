package com.greenlink.glsupply.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 批量审核请求。approve 时 remark 可空；reject 时 remark 必填（由 Controller 校验）。
 */
@Data
public class BatchAuditRequest {

    @NotEmpty(message = "请至少选择一条记录")
    private List<Long> ids;

    @Size(max = 500, message = "审核备注不超过500字")
    private String remark;
}
