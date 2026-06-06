package com.greenlink.glmember.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchSetTagRelationsRequest {
    private String bizType;
    private Long bizId;
    private List<Long> tagIds;
}
