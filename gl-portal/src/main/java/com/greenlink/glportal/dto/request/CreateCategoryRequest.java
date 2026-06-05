package com.greenlink.glportal.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCategoryRequest {

    @NotBlank(message = "栏目名称不能为空")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "栏目编码不能为空")
    @Size(max = 50)
    private String code;

    private Long parentId;

    private Integer sortOrder;

    private Boolean isVisible;
}
