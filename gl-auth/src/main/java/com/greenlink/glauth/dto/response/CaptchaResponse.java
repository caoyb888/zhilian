package com.greenlink.glauth.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CaptchaResponse {

    private String captchaToken;
    private String imageBase64;
    private int expireIn;
}
