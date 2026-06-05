package com.greenlink.gltag.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTagRequest {

    @NotNull(message = "所属分类不能为空")
    private Long categoryId;

    @NotBlank(message = "标签名称不能为空")
    @Size(max = 100)
    private String name;

    @Size(max = 200)
    private String alias;

    private Integer sortOrder = 0;
}
