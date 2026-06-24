package com.greenlink.glsupply.dto.response;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * 批量审核结果：允许部分成功，逐条记录失败原因。
 */
@Data
public class BatchAuditResultVO {

    private int total;
    private int success;
    private int failed;
    private List<String> errors = new ArrayList<>();

    public void addError(Long id, String reason) {
        this.failed++;
        this.errors.add("ID " + id + "：" + reason);
    }

    public void addSuccess() {
        this.success++;
    }
}
