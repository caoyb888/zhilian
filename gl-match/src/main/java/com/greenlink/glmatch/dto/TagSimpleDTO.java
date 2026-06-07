package com.greenlink.glmatch.dto;

import lombok.Data;

/** gl-tag TagSimpleVO 的本地镜像，避免跨模块 jar 依赖 */
@Data
public class TagSimpleDTO {
    private Long id;
    private String name;
    private String categoryCode;
}
