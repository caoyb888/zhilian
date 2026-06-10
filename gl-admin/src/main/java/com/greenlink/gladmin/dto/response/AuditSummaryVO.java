package com.greenlink.gladmin.dto.response;

import lombok.Data;

import java.util.List;

/**
 * 管理端供需审核汇总 VO（S7-02）：待审核数量 + 近7日逐日审核量。
 */
@Data
public class AuditSummaryVO {
    private long pendingResourceCount;
    private long pendingDemandCount;
    private long totalPendingAudit;
    /** 近7日每日审核量，升序（index 0 = 6天前，index 6 = 今天） */
    private List<AuditDailyStat> last7DaysAudit;
}
