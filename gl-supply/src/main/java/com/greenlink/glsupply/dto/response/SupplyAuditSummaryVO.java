package com.greenlink.glsupply.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class SupplyAuditSummaryVO {
    /** 待审核资源数（audit_status=0） */
    private long pendingResourceCount;
    /** 待审核需求数（audit_status=0） */
    private long pendingDemandCount;
    /** 合计待审核数 */
    private long totalPendingAudit;
    /** 近7日每日已审核量（含当日，由近到远升序，长度固定为 7） */
    private List<AuditDailyVO> last7DaysAudit;
}
