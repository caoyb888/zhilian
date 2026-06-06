package com.greenlink.glportal.mq;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticleEventMessage {

    public static final String EVENT_SAVE = "SAVE";
    public static final String EVENT_DELETE = "DELETE";

    private String eventType;
    private Long articleId;
}
