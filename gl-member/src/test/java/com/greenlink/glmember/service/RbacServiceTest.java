package com.greenlink.glmember.service;

import com.greenlink.common.exception.BizException;
import com.greenlink.glmember.domain.MemberAccount;
import com.greenlink.glmember.domain.RbacAccountRole;
import com.greenlink.glmember.domain.RbacPermission;
import com.greenlink.glmember.domain.RbacRole;
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
import com.greenlink.glmember.service.impl.RbacServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RbacServiceTest {

    @Mock RbacRoleMapper roleMapper;
    @Mock RbacPermissionMapper permissionMapper;
    @Mock RbacAccountRoleMapper accountRoleMapper;
    @Mock RbacRolePermissionMapper rolePermissionMapper;
    @Mock MemberAccountMapper accountMapper;

    @InjectMocks RbacServiceImpl rbacService;

    private RbacRole systemRole;
    private RbacRole customRole;

    @BeforeEach
    void setUp() {
        systemRole = new RbacRole();
        systemRole.setId(1L);
        systemRole.setCode("SUPER_ADMIN");
        systemRole.setName("超级管理员");
        systemRole.setIsSystem(1);
        systemRole.setIsDeleted(0);

        customRole = new RbacRole();
        customRole.setId(99L);
        customRole.setCode("CUSTOM_ROLE");
        customRole.setName("自定义角色");
        customRole.setIsSystem(0);
        customRole.setIsDeleted(0);
    }

    @Test
    void createRole_success() {
        when(roleMapper.findIdByCode("CUSTOM_ROLE")).thenReturn(null);
        when(roleMapper.insert(any(RbacRole.class))).thenReturn(1);

        CreateRoleRequest req = new CreateRoleRequest();
        req.setCode("CUSTOM_ROLE");
        req.setName("自定义角色");
        req.setDescription("测试用角色");

        RoleVO result = rbacService.createRole(req);

        assertThat(result.getCode()).isEqualTo("CUSTOM_ROLE");
        assertThat(result.getIsSystem()).isFalse();
        verify(roleMapper).insert(any(RbacRole.class));
    }

    @Test
    void createRole_duplicateCode_throws() {
        when(roleMapper.findIdByCode("DUPLICATE")).thenReturn(1L);

        CreateRoleRequest req = new CreateRoleRequest();
        req.setCode("DUPLICATE");
        req.setName("重复角色");

        assertThatThrownBy(() -> rbacService.createRole(req))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("角色编码已存在");
    }

    @Test
    void deleteRole_systemRole_throws() {
        when(roleMapper.selectById(1L)).thenReturn(systemRole);

        assertThatThrownBy(() -> rbacService.deleteRole(1L))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("系统内置角色不可删除");
        verify(roleMapper, never()).deleteById(anyLong());
    }

    @Test
    void deleteRole_customRole_success() {
        when(roleMapper.selectById(99L)).thenReturn(customRole);
        when(roleMapper.deleteById(99L)).thenReturn(1);

        rbacService.deleteRole(99L);

        verify(roleMapper).deleteById(99L);
        verify(rolePermissionMapper).deleteByRoleId(99L);
        verify(accountRoleMapper).delete(any());
    }

    @Test
    void getPermissionTree_buildsTreeCorrectly() {
        RbacPermission parent = new RbacPermission();
        parent.setId(1L); parent.setCode("supply"); parent.setName("供需管理");
        parent.setType(1); parent.setParentId(null); parent.setSortOrder(1); parent.setIsDeleted(0);

        RbacPermission child = new RbacPermission();
        child.setId(11L); child.setCode("supply:resource:list"); child.setName("资源列表");
        child.setType(2); child.setParentId(1L); child.setSortOrder(1); child.setIsDeleted(0);

        when(permissionMapper.selectList(any())).thenReturn(List.of(parent, child));

        List<PermissionVO> tree = rbacService.getPermissionTree();

        assertThat(tree).hasSize(1);
        assertThat(tree.get(0).getCode()).isEqualTo("supply");
        assertThat(tree.get(0).getChildren()).hasSize(1);
        assertThat(tree.get(0).getChildren().get(0).getCode()).isEqualTo("supply:resource:list");
    }

    @Test
    void assignPermissionsToRole_roleNotFound_throws() {
        when(roleMapper.selectById(999L)).thenReturn(null);

        AssignPermissionsRequest req = new AssignPermissionsRequest();
        req.setPermissionIds(List.of(1L, 2L));

        assertThatThrownBy(() -> rbacService.assignPermissionsToRole(999L, req))
                .isInstanceOf(BizException.class);
    }

    @Test
    void assignRolesToAccount_accountNotFound_throws() {
        when(accountMapper.selectById(999L)).thenReturn(null);

        AssignRolesRequest req = new AssignRolesRequest();
        req.setRoleIds(List.of(1L));

        assertThatThrownBy(() -> rbacService.assignRolesToAccount(999L, req))
                .isInstanceOf(BizException.class);
    }

    @Test
    void assignRolesToAccount_success() {
        MemberAccount account = new MemberAccount();
        account.setId(100L);
        when(accountMapper.selectById(100L)).thenReturn(account);
        when(roleMapper.selectById(1L)).thenReturn(systemRole);

        AssignRolesRequest req = new AssignRolesRequest();
        req.setRoleIds(List.of(1L));

        rbacService.assignRolesToAccount(100L, req);

        verify(accountRoleMapper).delete(any());
        verify(accountRoleMapper).insert(any(RbacAccountRole.class));
    }
}
