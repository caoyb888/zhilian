package com.greenlink.glsupply.dto.request;

import lombok.Data;

@Data
public class DemandPageRequest {

    private int page = 1;
    private int size = 20;
    private String keyword;
    private String type;
    private String province;
    private Long tagId;
    private Integer auditStatus;
    private Long memberId;
}
