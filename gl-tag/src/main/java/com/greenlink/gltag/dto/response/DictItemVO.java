package com.greenlink.gltag.dto.response;

import lombok.Data;

@Data
public class DictItemVO {

    private Long id;
    private String typeCode;
    private String value;
    private String label;
    private String parentValue;
    private Integer sortOrder;
    private Boolean isActive;
}
