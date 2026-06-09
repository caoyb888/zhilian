package com.greenlink.glmessage.dto.response;

import lombok.Data;

@Data
public class UnreadCountVO {

    private long total;
    private long match;
    private long audit;
    private long activity;
    private long system;
}
