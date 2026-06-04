package com.greenlink.glmember.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class AssignRolesRequest {

    @NotNull(message = "角色ID列表不能为null")
    private List<Long> roleIds;
}
