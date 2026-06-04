package com.greenlink.glmember.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AdminAccountVO {

    private Long id;
    private Long memberId;
    private String memberName;
    private Long parentId;
    private String username;
    private String realName;
    private String phone;
    private Integer status;
    private List<String> roles;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
