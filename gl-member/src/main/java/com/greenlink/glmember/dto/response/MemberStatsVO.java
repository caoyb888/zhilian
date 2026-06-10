package com.greenlink.glmember.dto.response;

import lombok.Data;

@Data
public class MemberStatsVO {
    /** 正常状态（status=1）的会员单位总数 */
    private long totalMembers;
    /** 本自然月内新注册（created_at 在当月）的会员单位数 */
    private long newMembersThisMonth;
}
