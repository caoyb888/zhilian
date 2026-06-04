package com.greenlink.glmember.dto.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/** 账号信息（用于子账号列表） */
@Data
public class AccountVO {

    private Long id;
    private Long memberId;
    private Long parentId;
    private String username;
    private String realName;
    private String phone;
    private String avatarUrl;
    private Integer status;
    private List<String> roles;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
