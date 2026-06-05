package com.greenlink.glportal.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SignupVO {

    private Long id;
    private Long activityId;
    private Long accountId;
    private Long memberId;
    private String remark;
    private Integer status;     // 1已报名 2已签到 3已取消
    private LocalDateTime createdAt;
}
