package com.greenlink.glsupply.dto.response;

import lombok.Data;

@Data
public class SupplyBriefVO {
    private Long id;
    private Long memberId;
    private String province;
    private String type;
    private Integer auditStatus;
}
