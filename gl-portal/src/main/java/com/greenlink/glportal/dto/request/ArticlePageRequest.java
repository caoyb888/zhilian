package com.greenlink.glportal.dto.request;

import lombok.Data;

@Data
public class ArticlePageRequest {

    private Long categoryId;
    private String keyword;
    private Boolean isTop;
    private Boolean published;
    private int page = 1;
    private int size = 20;
}
