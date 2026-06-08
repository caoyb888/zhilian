package com.greenlink.glmatch.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class FavoriteRequest {

    @NotBlank
    @Pattern(regexp = "RESOURCE|DEMAND", message = "bizType 只能为 RESOURCE 或 DEMAND")
    private String bizType;

    @NotNull
    private Long bizId;
}
