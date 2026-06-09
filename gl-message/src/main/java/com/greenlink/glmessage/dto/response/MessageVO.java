package com.greenlink.glmessage.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageVO {

    private Long id;
    private String bizType;
    private Long bizId;
    private String title;
    private String content;
    private String channel;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
