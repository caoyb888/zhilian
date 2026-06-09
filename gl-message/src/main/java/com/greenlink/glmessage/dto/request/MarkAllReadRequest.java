package com.greenlink.glmessage.dto.request;

import lombok.Data;

@Data
public class MarkAllReadRequest {

    /** 可选，不传则全部标记已读；传值则只标记该业务类型（MATCH/AUDIT/ACTIVITY/SYSTEM）。*/
    private String bizType;
}
