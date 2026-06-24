package com.greenlink.gltag.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateDictItemRequest {

    @Size(max = 100)
    private String label;

    @Size(max = 50)
    private String parentValue;

    private Integer sortOrder;

    private Boolean isActive;
}
