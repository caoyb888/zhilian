package com.greenlink.glmember.controller;

import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.Result;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glmember.dto.request.AssignPermissionsRequest;
import com.greenlink.glmember.dto.request.AssignRolesRequest;
import com.greenlink.glmember.dto.request.CreateRoleRequest;
import com.greenlink.glmember.dto.response.PermissionVO;
import com.greenlink.glmember.dto.response.RoleVO;
import com.greenlink.glmember.service.RbacService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rbac")
@RequiredArgsConstructor
public class RbacController {

    private final RbacService rbacService;

    /** 获取全部角色列表（含各角色已绑定的权限ID） */
    @GetMapping("/roles")
    public Result<List<RoleVO>> listRoles(HttpServletRequest request) {
        requireAdmin(request);
        return Result.ok(rbacService.listRoles());
    }

    /** 创建自定义角色 */
    @PostMapping("/roles")
    public Result<RoleVO> createRole(@Valid @RequestBody CreateRoleRequest req,
                                     HttpServletRequest request) {
        requireAdmin(request);
        return Result.ok(rbacService.createRole(req));
    }

    /** 删除角色（仅非系统角色） */
    @DeleteMapping("/roles/{roleId}")
    public Result<Void> deleteRole(@PathVariable Long roleId,
                                   HttpServletRequest request) {
        requireAdmin(request);
        rbacService.deleteRole(roleId);
        return Result.ok();
    }

    /** 获取权限树（两级：菜单→操作） */
    @GetMapping("/permissions")
    public Result<List<PermissionVO>> getPermissions(HttpServletRequest request) {
        requireAdmin(request);
        return Result.ok(rbacService.getPermissionTree());
    }

    /** 为角色分配权限（全量覆盖），仅超级管理员可操作 */
    @PutMapping("/roles/{roleId}/permissions")
    public Result<Void> assignPermissions(@PathVariable Long roleId,
                                          @Valid @RequestBody AssignPermissionsRequest req,
                                          HttpServletRequest request) {
        requireSuperAdmin(request);
        rbacService.assignPermissionsToRole(roleId, req);
        return Result.ok();
    }

    /** 为账号分配角色（全量覆盖） */
    @PutMapping("/accounts/{accountId}/roles")
    public Result<Void> assignRoles(@PathVariable Long accountId,
                                    @Valid @RequestBody AssignRolesRequest req,
                                    HttpServletRequest request) {
        requireAdmin(request);
        rbacService.assignRolesToAccount(accountId, req);
        return Result.ok();
    }

    // ─── 内部工具方法 ──────────────────────────────────────

    private void requireAdmin(HttpServletRequest request) {
        String roles = request.getHeader("X-Roles");
        if (roles == null || !containsAnyAdminRole(roles)) {
            throw new BizException(ResultCode.FORBIDDEN);
        }
    }

    private void requireSuperAdmin(HttpServletRequest request) {
        String roles = request.getHeader("X-Roles");
        if (roles == null || !roles.contains("SUPER_ADMIN")) {
            throw new BizException(ResultCode.FORBIDDEN);
        }
    }

    private boolean containsAnyAdminRole(String roles) {
        return roles.contains("SUPER_ADMIN") || roles.contains("CONTENT_ADMIN")
                || roles.contains("AUDITOR") || roles.contains("FINANCE");
    }
}
