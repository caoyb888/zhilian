package com.greenlink.glmatch.dto;

import lombok.Data;

/** 每个 match_id 的未读消息数，供批量查询结果映射 */
@Data
public class MatchUnreadCount {
    private Long matchId;
    private Integer cnt;
}
