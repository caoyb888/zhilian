package com.greenlink.gltag.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateTagRequest {

    @Size(max = 100)
    private String name;

    @Size(max = 200)
    private String alias;

    private Integer sortOrder;

    private Integer isActive;
}
