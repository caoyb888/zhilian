package com.greenlink.gltag.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class TagCategoryVO {

    private Long id;
    private String name;
    private String code;
    private Integer sortOrder;
    private Boolean isActive;
    private List<TagVO> tags;
}
