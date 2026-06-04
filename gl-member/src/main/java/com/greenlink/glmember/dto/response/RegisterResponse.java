package com.greenlink.glmember.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegisterResponse {

    private Long memberId;
    private Integer memberStatus;
    private Long accountId;
}
