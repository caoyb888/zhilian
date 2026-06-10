package com.greenlink.gladmin.dto.response;

import lombok.Data;

@Data
public class SupplyStatsDTO {
    private long pendingResourceCount;
    private long pendingDemandCount;
    private long totalPendingAudit;
}
