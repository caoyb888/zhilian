package com.greenlink.glmember.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glmember.domain.MemberAccount;
import com.greenlink.glmember.domain.RbacAccountRole;
import com.greenlink.glmember.domain.RbacPermission;
import com.greenlink.glmember.domain.RbacRole;
import com.greenlink.glmember.domain.RbacRolePermission;
import com.greenlink.glmember.dto.request.AssignPermissionsRequest;
import com.greenlink.glmember.dto.request.AssignRolesRequest;
import com.greenlink.glmember.dto.request.CreateRoleRequest;
import com.greenlink.glmember.dto.response.PermissionVO;
import com.greenlink.glmember.dto.response.RoleVO;
import com.greenlink.glmember.repository.MemberAccountMapper;
import com.greenlink.glmember.repository.RbacAccountRoleMapper;
import com.greenlink.glmember.repository.RbacPermissionMapper;
import com.greenlink.glmember.repository.RbacRoleMapper;
import com.greenlink.glmember.repository.RbacRolePermissionMapper;
import com.greenlink.glmember.service.RbacService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RbacServiceImpl implements RbacService {

    private final RbacRoleMapper roleMapper;
    private final RbacPermissionMapper permissionMapper;
    private final RbacAccountRoleMapper accountRoleMapper;
    private final RbacRolePermissionMapper rolePermissionMapper;
    private final MemberAccountMapper accountMapper;

    @Override
    public List<RoleVO> listRoles() {
        List<RbacRole> roles = roleMapper.selectList(
                new LambdaQueryWrapper<RbacRole>().orderByAsc(RbacRole::getId));

        return roles.stream().map(role -> {
            List<Long> permIds = rolePermissionMapper.findPermissionIdsByRoleId(role.getId());
            return RoleVO.builder()
                    .id(role.getId())
                    .code(role.getCode())
                    .name(role.getName())
                    .description(role.getDescription())
                    .isSystem(role.getIsSystem() == 1)
                    .permissionIds(permIds)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RoleVO createRole(CreateRoleRequest request) {
        Long existing = roleMapper.findIdByCode(request.getCode());
        if (existing != null) {
            throw new BizException(ResultCode.PARAM_ERROR, "角色编码已存在：" + request.getCode());
        }
        RbacRole role = new RbacRole();
        role.setCode(request.getCode());
        role.setName(request.getName());
        role.setDescription(request.getDescription());
        role.setIsSystem(0);
        role.setIsDeleted(0);
        roleMapper.insert(role);
        log.info("创建自定义角色: code={}, id={}", role.getCode(), role.getId());
        return RoleVO.builder()
                .id(role.getId())
                .code(role.getCode())
                .name(role.getName())
                .description(role.getDescription())
                .isSystem(false)
                .permissionIds(new ArrayList<>())
                .build();
    }

    @Override
    @Transactional
    public void deleteRole(Long roleId) {
        RbacRole role = roleMapper.selectById(roleId);
        if (role == null) {
            throw new BizException(ResultCode.NOT_FOUND, "角色不存在");
        }
        if (role.getIsSystem() == 1) {
            throw new BizException(ResultCode.FORBIDDEN, "系统内置角色不可删除");
        }
        roleMapper.deleteById(roleId);
        rolePermissionMapper.deleteByRoleId(roleId);
        accountRoleMapper.delete(
                new LambdaQueryWrapper<RbacAccountRole>().eq(RbacAccountRole::getRoleId, roleId));
        log.info("删除自定义角色: id={}, code={}", roleId, role.getCode());
    }

    @Override
    public List<PermissionVO> getPermissionTree() {
        List<RbacPermission> all = permissionMapper.selectList(
                new LambdaQueryWrapper<RbacPermission>().orderByAsc(RbacPermission::getSortOrder));

        Map<Long, PermissionVO> nodeMap = all.stream().collect(Collectors.toMap(
                RbacPermission::getId,
                p -> PermissionVO.builder()
                        .id(p.getId())
                        .code(p.getCode())
                        .name(p.getName())
                        .type(p.getType())
                        .sortOrder(p.getSortOrder())
                        .children(new ArrayList<>())
                        .build()));

        List<PermissionVO> roots = new ArrayList<>();
        for (RbacPermission p : all) {
            PermissionVO node = nodeMap.get(p.getId());
            if (p.getParentId() == null) {
                roots.add(node);
            } else {
                PermissionVO parent = nodeMap.get(p.getParentId());
                if (parent != null) {
                    parent.getChildren().add(node);
                }
            }
        }
        return roots;
    }

    @Override
    @Transactional
    public void assignPermissionsToRole(Long roleId, AssignPermissionsRequest request) {
        RbacRole role = roleMapper.selectById(roleId);
        if (role == null) {
            throw new BizException(ResultCode.NOT_FOUND, "角色不存在");
        }
        rolePermissionMapper.deleteByRoleId(roleId);
        if (!CollectionUtils.isEmpty(request.getPermissionIds())) {
            List<RbacRolePermission> items = request.getPermissionIds().stream()
                    .map(pid -> RbacRolePermission.builder()
                            .roleId(roleId)
                            .permissionId(pid)
                            .createdAt(LocalDateTime.now())
                            .build())
                    .collect(Collectors.toList());
            items.forEach(rolePermissionMapper::insert);
        }
        log.info("分配权限给角色: roleId={}, permCount={}", roleId,
                request.getPermissionIds() == null ? 0 : request.getPermissionIds().size());
    }

    @Override
    @Transactional
    public void assignRolesToAccount(Long accountId, AssignRolesRequest request) {
        MemberAccount account = accountMapper.selectById(accountId);
        if (account == null) {
            throw new BizException(ResultCode.NOT_FOUND, "账号不存在");
        }
        accountRoleMapper.delete(
                new LambdaQueryWrapper<RbacAccountRole>().eq(RbacAccountRole::getAccountId, accountId));
        if (!CollectionUtils.isEmpty(request.getRoleIds())) {
            request.getRoleIds().forEach(roleId -> {
                RbacRole role = roleMapper.selectById(roleId);
                if (role == null) {
                    throw new BizException(ResultCode.NOT_FOUND, "角色不存在: " + roleId);
                }
                accountRoleMapper.insert(RbacAccountRole.builder()
                        .accountId(accountId)
                        .roleId(roleId)
                        .createdAt(LocalDateTime.now())
                        .build());
            });
        }
        log.info("分配角色给账号: accountId={}, roleCount={}", accountId,
                request.getRoleIds() == null ? 0 : request.getRoleIds().size());
    }
}
