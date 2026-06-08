package com.greenlink.glmatch.dto;

import lombok.Data;

/** gl-member MemberBriefVO 的本地镜像，避免跨模块 jar 依赖 */
@Data
public class MemberBriefDTO {
    private Long id;
    private String name;
    private Integer memberLevel;
    private String province;
}
