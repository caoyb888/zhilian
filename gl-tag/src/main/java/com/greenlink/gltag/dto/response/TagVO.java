package com.greenlink.gltag.dto.response;

import lombok.Data;

@Data
public class TagVO {

    private Long id;
    private Long categoryId;
    private String categoryCode;
    private String name;
    private String alias;
    private Integer sortOrder;
    private Boolean isActive;
}
