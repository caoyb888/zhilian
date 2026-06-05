package com.greenlink.gltag.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BatchSetTagRelationsRequest {

    @NotBlank(message = "bizType 不能为空")
    private String bizType;

    @NotNull(message = "bizId 不能为空")
    private Long bizId;

    private List<Long> tagIds;
}
