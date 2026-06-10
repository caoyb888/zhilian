package com.greenlink.glsupply.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditDailyVO {
    /** 日期，格式 yyyy-MM-dd */
    private String date;
    /** 当日已审核总数（资源 + 需求，状态为通过或拒绝） */
    private long auditedCount;
}
