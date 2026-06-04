package com.greenlink.glmember.service;

import com.greenlink.glmember.dto.request.AssignPermissionsRequest;
import com.greenlink.glmember.dto.request.AssignRolesRequest;
import com.greenlink.glmember.dto.request.CreateRoleRequest;
import com.greenlink.glmember.dto.response.PermissionVO;
import com.greenlink.glmember.dto.response.RoleVO;

import java.util.List;

public interface RbacService {

    List<RoleVO> listRoles();

    RoleVO createRole(CreateRoleRequest request);

    void deleteRole(Long roleId);

    List<PermissionVO> getPermissionTree();

    void assignPermissionsToRole(Long roleId, AssignPermissionsRequest request);

    void assignRolesToAccount(Long accountId, AssignRolesRequest request);
}
