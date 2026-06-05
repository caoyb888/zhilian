package com.greenlink.glportal.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ArticleVO {

    private Long id;
    private Long categoryId;
    private String categoryName;
    private String title;
    private String summary;
    private String coverUrl;
    private String author;
    private Integer viewCount;
    private Boolean isTop;
    private Boolean isPublished;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
}
