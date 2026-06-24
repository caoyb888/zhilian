package com.greenlink.gltag.dto.response;

import lombok.Data;

@Data
public class DictTypeVO {

    private Long id;
    private String code;
    private String name;
    private String remark;
    private Boolean isActive;
}
