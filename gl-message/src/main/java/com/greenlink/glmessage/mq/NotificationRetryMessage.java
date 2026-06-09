package com.greenlink.glmessage.mq;

import lombok.Data;

@Data
public class NotificationRetryMessage {

    public static final String TOPIC = "gl-message-retry";

    private Long notificationId;
}
