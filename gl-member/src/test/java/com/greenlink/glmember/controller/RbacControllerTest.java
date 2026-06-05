package com.greenlink.glmember.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glmember.dto.request.CreateRoleRequest;
import com.greenlink.glmember.dto.response.RoleVO;
import com.greenlink.glmember.service.RbacService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * S2-14 接口自动化测试：RBAC 权限模块（TC-01 ~ TC-05）
 */
@ExtendWith(MockitoExtension.class)
class RbacControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock RbacService rbacService;
    @InjectMocks RbacController rbacController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(rbacController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-01  GET /api/v1/rbac/roles — 管理员身份，返回角色列表
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-01 listRoles — 携带管理员角色头，返回 code=0 及角色列表")
    void tc01_listRoles_withAdminRole_returns200() throws Exception {
        RoleVO role = RoleVO.builder()
                .id(1L).code("SUPER_ADMIN").name("超级管理员")
                .isSystem(true).permissionIds(List.of(1L, 2L, 3L))
                .build();
        when(rbacService.listRoles()).thenReturn(List.of(role));

        mockMvc.perform(get("/api/v1/rbac/roles")
                        .header("X-Roles", "SUPER_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data[0].code").value("SUPER_ADMIN"))
                .andExpect(jsonPath("$.data[0].isSystem").value(true));

        verify(rbacService).listRoles();
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-02  GET /api/v1/rbac/roles — 无管理员角色头，返回 FORBIDDEN
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-02 listRoles — 无管理员角色头，返回 code=1003 FORBIDDEN")
    void tc02_listRoles_withoutAdminRole_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/rbac/roles")
                        .header("X-Roles", "MEMBER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ResultCode.FORBIDDEN.getCode()));

        verify(rbacService, never()).listRoles();
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-03  POST /api/v1/rbac/roles — 合法请求，成功创建角色
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-03 createRole — 合法请求，返回 code=0 及新建角色信息")
    void tc03_createRole_validRequest_returns200() throws Exception {
        CreateRoleRequest req = new CreateRoleRequest();
        req.setCode("AUDITOR_SENIOR");
        req.setName("高级审核员");
        req.setDescription("可审核供需和文章");

        RoleVO created = RoleVO.builder()
                .id(10L).code("AUDITOR_SENIOR").name("高级审核员")
                .description("可审核供需和文章").isSystem(false).permissionIds(List.of())
                .build();
        when(rbacService.createRole(any(CreateRoleRequest.class))).thenReturn(created);

        mockMvc.perform(post("/api/v1/rbac/roles")
                        .header("X-Roles", "SUPER_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.code").value("AUDITOR_SENIOR"))
                .andExpect(jsonPath("$.data.isSystem").value(false));
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-04  POST /api/v1/rbac/roles — code 字段为空，返回参数校验错误
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-04 createRole — code 字段为空，返回 code=1001 参数错误")
    void tc04_createRole_blankCode_returnsParamError() throws Exception {
        CreateRoleRequest req = new CreateRoleRequest();
        req.setCode("");           // 违反 @NotBlank
        req.setName("测试角色");

        mockMvc.perform(post("/api/v1/rbac/roles")
                        .header("X-Roles", "SUPER_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ResultCode.PARAM_ERROR.getCode()));

        verify(rbacService, never()).createRole(any());
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-05  DELETE /api/v1/rbac/roles/{id} — 管理员身份删除自定义角色
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-05 deleteRole — 管理员身份删除自定义角色，返回 code=0")
    void tc05_deleteRole_withAdminRole_returns200() throws Exception {
        doNothing().when(rbacService).deleteRole(99L);

        mockMvc.perform(delete("/api/v1/rbac/roles/99")
                        .header("X-Roles", "SUPER_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));

        verify(rbacService).deleteRole(99L);
    }
}
