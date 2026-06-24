package com.greenlink.glmatch.dto.response;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/** 批量对接结果，允许部分成功，逐条记录失败原因。 */
@Data
public class BatchMatchApplyVO {

    private int total;
    private int success;
    private int failed;
    private List<String> errors = new ArrayList<>();

    public void addSuccess() {
        this.success++;
    }

    public void addError(String reason) {
        this.failed++;
        this.errors.add(reason);
    }
}
