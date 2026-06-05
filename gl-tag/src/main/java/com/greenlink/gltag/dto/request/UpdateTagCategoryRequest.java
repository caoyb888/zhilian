package com.greenlink.gltag.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateTagCategoryRequest {

    @Size(max = 100)
    private String name;

    private Integer sortOrder;

    private Integer isActive;
}
