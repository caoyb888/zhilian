package com.greenlink.glmatch.dto;

import lombok.Data;

/** MatchRecordMapper 历史对接统计查询的结果行 */
@Data
public class MemberCompletedCount {
    private Long memberId;
    private Integer cnt;
}
