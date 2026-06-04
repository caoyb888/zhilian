package com.greenlink.glmember.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class RoleVO {

    private Long id;
    private String code;
    private String name;
    private String description;
    private Boolean isSystem;
    /** 该角色已绑定的权限ID列表（批量分配时回显用） */
    private List<Long> permissionIds;
}
