package com.greenlink.gladmin.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ChannelStatDTO {
    private long totalProcessed;
    private long successCount;
    private long failedCount;
    private BigDecimal successRate;
}
