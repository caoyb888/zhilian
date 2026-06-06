package com.greenlink.glportal.dto.response;

import lombok.Data;

@Data
public class ActivitySignupStatusVO {

    private boolean signed;
    private Long signupId;
    private Integer signupStatus; // 1已报名 2已签到，未报名时为 null
}
