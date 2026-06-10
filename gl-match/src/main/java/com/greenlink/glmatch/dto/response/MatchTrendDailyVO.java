package com.greenlink.glmatch.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchTrendDailyVO {
    /** 日期，格式 yyyy-MM-dd */
    private String date;
    /** 当日新增对接申请数（created_at 在该日） */
    private long newMatchCount;
}
