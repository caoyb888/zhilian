package com.greenlink.glmatch.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class MatchDetailStatsVO {
    /** 总对接数（未删除） */
    private long totalMatchCount;
    /** 已完成对接数（status=5） */
    private long completedMatchCount;
    /** 对接成功率（0-100.00） */
    private BigDecimal successRate;
    /** 近30日每日新增对接趋势（固定30条，升序，index 0 = 29天前） */
    private List<MatchTrendDailyVO> last30DaysTrend;
}
