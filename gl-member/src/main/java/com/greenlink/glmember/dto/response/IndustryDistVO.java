package com.greenlink.glmember.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IndustryDistVO {
    /** 行业名称（与 member_unit.industry 值一致） */
    private String industry;
    /** 该行业正常状态（status=1）的会员单位数 */
    private long count;
}
