package com.greenlink.glportal.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class CategoryVO {

    private Long id;
    private Long parentId;
    private String name;
    private String code;
    private Integer sortOrder;
    private Boolean isVisible;
    private List<CategoryVO> children;
}
