package com.greenlink.glsupply.mq;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceEventMessage {

    public static final String EVENT_SAVE = "SAVE";
    public static final String EVENT_DELETE = "DELETE";

    private String eventType;
    private Long resourceId;
}
