package com.greenlink.glauth.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AccountInfoVO {

    private Long accountId;
    private Long memberId;
    private String username;
    private String realName;
    private String avatarUrl;
    private List<String> roles;
    private String memberName;
    private Integer memberLevel;
}
