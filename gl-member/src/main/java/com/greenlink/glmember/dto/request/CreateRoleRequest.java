package com.greenlink.glmember.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateRoleRequest {

    @NotBlank(message = "角色编码不能为空")
    @Pattern(regexp = "^[A-Z][A-Z0-9_]{1,49}$", message = "角色编码须大写字母开头，只含大写字母/数字/下划线，2-50位")
    private String code;

    @NotBlank(message = "角色名称不能为空")
    @Size(max = 100, message = "角色名称最多100个字符")
    private String name;

    @Size(max = 300, message = "描述最多300个字符")
    private String description;
}
