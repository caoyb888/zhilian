package com.greenlink.gltag.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTagCategoryRequest {

    @NotBlank(message = "分类名称不能为空")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "分类编码不能为空")
    @Size(max = 50)
    private String code;

    private Integer sortOrder = 0;
}
