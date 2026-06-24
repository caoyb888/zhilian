package com.greenlink.gltag.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateDictItemRequest {

    @NotBlank(message = "字典类型编码不能为空")
    @Size(max = 50)
    private String typeCode;

    @NotBlank(message = "字典值不能为空")
    @Size(max = 50)
    private String value;

    @NotBlank(message = "展示名不能为空")
    @Size(max = 100)
    private String label;

    @Size(max = 50)
    private String parentValue;

    private Integer sortOrder = 0;
}
