package com.greenlink.glportal.dto.response;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ArticleDetailVO extends ArticleVO {

    private String content;
    private String sourceUrl;
}
