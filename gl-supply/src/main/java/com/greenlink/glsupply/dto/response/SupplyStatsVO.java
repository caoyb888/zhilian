package com.greenlink.glsupply.dto.response;

import lombok.Data;

@Data
public class SupplyStatsVO {
    /** 待审核资源数（audit_status=0） */
    private long pendingResourceCount;
    /** 待审核需求数（audit_status=0） */
    private long pendingDemandCount;
    /** 合计待审核数 */
    private long totalPendingAudit;
}
