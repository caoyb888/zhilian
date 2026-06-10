package com.greenlink.gladmin.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class MatchStatsDTO {
    private long totalMatchCount;
    private long completedMatchCount;
    private BigDecimal successRate;
}
