package com.greenlink.gladmin.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 管理端对接数据统计 VO（S7-03）：总对接数 + 成功率 + 近30日逐日趋势。
 */
@Data
public class MatchDetailStatsVO {
    private long totalMatchCount;
    private long completedMatchCount;
    /** 对接成功率（0–100.00，两位小数） */
    private BigDecimal successRate;
    /** 近30日每日新增对接趋势，升序（index 0 = 29天前，index 29 = 今天） */
    private List<MatchTrendDailyStat> last30DaysTrend;
}
