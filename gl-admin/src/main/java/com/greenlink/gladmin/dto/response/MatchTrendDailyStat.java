package com.greenlink.gladmin.dto.response;

import lombok.Data;

@Data
public class MatchTrendDailyStat {
    /** 日期，格式 yyyy-MM-dd */
    private String date;
    /** 当日新增对接申请数 */
    private long newMatchCount;
}
