package com.greenlink.glmember.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/** GET /api/v1/members/me 响应 */
@Data
@Builder
public class MemberMeVO {

    private Long accountId;
    private String username;
    private String realName;
    private String phone;
    private String email;
    private String avatarUrl;
    private List<String> roles;
    private List<String> permissions;
    private MemberSummary member;
    private Boolean isMainAccount;
    private LocalDateTime lastLoginAt;

    @Data
    @Builder
    public static class MemberSummary {
        private Long id;
        private String name;
        private Integer memberLevel;
        private Integer status;
    }
}
