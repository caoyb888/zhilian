package com.greenlink.glmatch.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Data
public class MatchStatsVO {
    /** 总对接记录数（未删除） */
    private long totalMatchCount;
    /** 已完成对接数（status=5） */
    private long completedMatchCount;
    /** 对接成功率（0-100.00，两位小数），无记录时为 0 */
    private BigDecimal successRate;

    public static MatchStatsVO of(long total, long completed) {
        MatchStatsVO vo = new MatchStatsVO();
        vo.setTotalMatchCount(total);
        vo.setCompletedMatchCount(completed);
        if (total == 0) {
            vo.setSuccessRate(BigDecimal.ZERO);
        } else {
            vo.setSuccessRate(BigDecimal.valueOf(completed * 100L)
                    .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP));
        }
        return vo;
    }
}
