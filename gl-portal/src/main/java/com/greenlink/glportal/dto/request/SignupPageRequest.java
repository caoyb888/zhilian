package com.greenlink.glportal.dto.request;

import lombok.Data;

@Data
public class SignupPageRequest {

    private Integer status;
    private int page = 1;
    private int size = 20;
}
