package com.greenlink.glportal.dto.request;

import lombok.Data;

@Data
public class ActivityPageRequest {

    private Integer status;
    private int page = 1;
    private int size = 20;
}
