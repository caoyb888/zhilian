package com.greenlink.glmatch.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FavoriteVO {

    private Long favoriteId;
    /** RESOURCE / DEMAND */
    private String bizType;
    private Long bizId;
    private String title;
    private String summary;
    /** 资源/需求子类型，如 PRODUCT / TECHNOLOGY / TALENT */
    private String type;
    private LocalDateTime createdAt;
}
