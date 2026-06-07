package com.greenlink.glmatch.dto;

import lombok.Data;

/** gl-supply SupplyBriefVO 的本地镜像，供 gl-match 召回过滤使用 */
@Data
public class SupplyBriefDTO {
    private Long id;
    private Long memberId;
    private String province;
    private String type;
    private Integer auditStatus;
}
