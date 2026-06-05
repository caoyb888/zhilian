package com.greenlink.glportal.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateCategoryRequest {

    @Size(max = 100)
    private String name;

    private Integer sortOrder;

    private Boolean isVisible;
}
