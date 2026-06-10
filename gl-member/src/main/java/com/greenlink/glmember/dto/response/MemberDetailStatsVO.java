package com.greenlink.glmember.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class MemberDetailStatsVO {
    /** 正常状态（status=1）的会员单位总数 */
    private long totalMembers;
    /** 本自然月内新注册的会员单位数 */
    private long newMembersThisMonth;
    /** 行业分布，按 count 降序，最多返回 TOP-20 */
    private List<IndustryDistVO> industryDistribution;
}
