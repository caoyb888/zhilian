package com.greenlink.glmatch.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FavoriteRequest {

    @NotBlank
    private String bizType;

    @NotNull
    private Long bizId;
}
