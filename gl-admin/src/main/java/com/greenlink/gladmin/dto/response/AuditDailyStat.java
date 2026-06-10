package com.greenlink.gladmin.dto.response;

import lombok.Data;

@Data
public class AuditDailyStat {
    /** 日期，格式 yyyy-MM-dd */
    private String date;
    /** 当日审核总量（资源 + 需求，通过 + 拒绝） */
    private long auditedCount;
}
