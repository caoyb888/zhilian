package com.greenlink.glportal.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateArticleRequest {

    private Long categoryId;

    @Size(max = 300)
    private String title;

    private String content;

    @Size(max = 500)
    private String summary;

    @Size(max = 500)
    private String coverUrl;

    @Size(max = 100)
    private String author;

    @Size(max = 500)
    private String sourceUrl;

    private Boolean isTop;
}
