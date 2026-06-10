package com.greenlink.gladmin.dto.response;

import lombok.Data;

@Data
public class MemberStatsDTO {
    private long totalMembers;
    private long newMembersThisMonth;
}
