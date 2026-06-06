package com.greenlink.glfile.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PresignUrlVO {

    private Long fileId;
    private String presignUrl;
    /** 有效秒数（公有文件为 null，直接访问） */
    private Integer expireSeconds;
    private boolean isPublic;
}
