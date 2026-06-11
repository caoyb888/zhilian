package com.greenlink.gladmin.dto.response;

import lombok.Data;

import java.util.List;

/**
 * 管理端会员数据统计 VO（S7-04）：总会员数 + 本月新增 + 行业分布。
 */
@Data
public class MemberDetailStatsVO {
    private long totalMembers;
    private long newMembersThisMonth;
    /** 行业分布，按数量降序，最多 TOP-20 */
    private List<IndustryDistStat> industryDistribution;
}
