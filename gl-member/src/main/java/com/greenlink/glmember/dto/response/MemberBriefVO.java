package com.greenlink.glmember.dto.response;

import lombok.Data;

/** 会员单位简要信息（供服务间 Feign 调用，不含敏感字段） */
@Data
public class MemberBriefVO {
    private Long id;
    private String name;
    private Integer memberLevel;
    private String province;
}
