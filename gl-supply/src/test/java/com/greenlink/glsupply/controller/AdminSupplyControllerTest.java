package com.greenlink.glsupply.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.glsupply.dto.request.AuditRequest;
import com.greenlink.glsupply.service.SupplyDemandService;
import com.greenlink.glsupply.service.SupplyResourceService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * S4-14 接口自动化测试：管理端供需审核 Controller 层（10 个用例）
 */
@ExtendWith(MockitoExtension.class)
class AdminSupplyControllerTest {

    private MockMvc resourceMvc;
    private MockMvc demandMvc;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Mock
    SupplyResourceService resourceService;
    @Mock
    SupplyDemandService demandService;

    @InjectMocks
    AdminResourceController resourceController;
    @InjectMocks
    AdminDemandController demandController;

    @BeforeEach
    void setUp() {
        MappingJackson2HttpMessageConverter converter =
                new MappingJackson2HttpMessageConverter(objectMapper);
        resourceMvc = MockMvcBuilders.standaloneSetup(resourceController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(converter)
                .build();
        demandMvc = MockMvcBuilders.standaloneSetup(demandController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(converter)
                .build();
    }

    // ═══════════════════════════════════════════════
    //  管理端 — 资源审核（TC-01 ~ TC-05）
    // ═══════════════════════════════════════════════

    // ─────────────────────────────────────────────
    // TC-01  GET /admin/supply/resources — 管理端资源列表
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-01 GET /admin/resources — 管理端资源列表返回 code=0")
    void adminResourceList_success() throws Exception {
        when(resourceService.adminPageList(any())).thenReturn(new Page<>(1, 20, 0));

        resourceMvc.perform(get("/api/v1/admin/supply/resources")
                        .param("page", "1")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    // ─────────────────────────────────────────────
    // TC-02  PATCH /admin/supply/resources/{id}/approve — 审核通过资源
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-02 PATCH /admin/resources/{id}/approve — 审核通过，返回 code=0")
    void approveResource_success() throws Exception {
        doNothing().when(resourceService).approve(anyLong(), anyLong());

        resourceMvc.perform(patch("/api/v1/admin/supply/resources/1/approve")
                        .header("X-Account-Id", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    // ─────────────────────────────────────────────
    // TC-03  PATCH /admin/supply/resources/{id}/reject — 审核拒绝资源（含 remark）
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-03 PATCH /admin/resources/{id}/reject — 填写 remark 拒绝成功，返回 code=0")
    void rejectResource_withRemark_success() throws Exception {
        doNothing().when(resourceService).reject(anyLong(), anyLong(), anyString());

        AuditRequest req = new AuditRequest();
        req.setRemark("内容不符合平台规范");

        resourceMvc.perform(patch("/api/v1/admin/supply/resources/1/reject")
                        .header("X-Account-Id", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    // ─────────────────────────────────────────────
    // TC-04  PATCH /admin/supply/resources/{id}/reject — remark 为空，参数校验失败
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-04 PATCH /admin/resources/{id}/reject — remark 为空，返回 code=1001")
    void rejectResource_emptyRemark_paramError() throws Exception {
        AuditRequest req = new AuditRequest();
        // remark 为 null

        resourceMvc.perform(patch("/api/v1/admin/supply/resources/1/reject")
                        .header("X-Account-Id", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    // ─────────────────────────────────────────────
    // TC-05  PATCH /admin/supply/resources/{id}/offline — 管理下架资源
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-05 PATCH /admin/resources/{id}/offline — 管理下架成功，返回 code=0")
    void offlineResource_success() throws Exception {
        doNothing().when(resourceService).adminOffline(anyLong(), anyLong());

        resourceMvc.perform(patch("/api/v1/admin/supply/resources/1/offline")
                        .header("X-Account-Id", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    // ═══════════════════════════════════════════════
    //  管理端 — 需求审核（TC-06 ~ TC-10）
    // ═══════════════════════════════════════════════

    // ─────────────────────────────────────────────
    // TC-06  GET /admin/supply/demands — 管理端需求列表
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-06 GET /admin/demands — 管理端需求列表返回 code=0")
    void adminDemandList_success() throws Exception {
        when(demandService.adminPageList(any())).thenReturn(new Page<>(1, 20, 0));

        demandMvc.perform(get("/api/v1/admin/supply/demands")
                        .param("page", "1")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    // ─────────────────────────────────────────────
    // TC-07  PATCH /admin/supply/demands/{id}/approve — 审核通过需求
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-07 PATCH /admin/demands/{id}/approve — 审核通过，返回 code=0")
    void approveDemand_success() throws Exception {
        doNothing().when(demandService).approve(anyLong(), anyLong());

        demandMvc.perform(patch("/api/v1/admin/supply/demands/1/approve")
                        .header("X-Account-Id", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    // ─────────────────────────────────────────────
    // TC-08  PATCH /admin/supply/demands/{id}/reject — 审核拒绝需求（含 remark）
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-08 PATCH /admin/demands/{id}/reject — 填写 remark 拒绝成功，返回 code=0")
    void rejectDemand_withRemark_success() throws Exception {
        doNothing().when(demandService).reject(anyLong(), anyLong(), anyString());

        AuditRequest req = new AuditRequest();
        req.setRemark("需求描述不清晰，请补充详情");

        demandMvc.perform(patch("/api/v1/admin/supply/demands/1/reject")
                        .header("X-Account-Id", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    // ─────────────────────────────────────────────
    // TC-09  PATCH /admin/supply/demands/{id}/reject — remark 为空，参数校验失败
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-09 PATCH /admin/demands/{id}/reject — remark 为空，返回 code=1001")
    void rejectDemand_emptyRemark_paramError() throws Exception {
        AuditRequest req = new AuditRequest();
        // remark 为 null

        demandMvc.perform(patch("/api/v1/admin/supply/demands/1/reject")
                        .header("X-Account-Id", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    // ─────────────────────────────────────────────
    // TC-10  PATCH /admin/supply/demands/{id}/offline — 管理下架需求
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-10 PATCH /admin/demands/{id}/offline — 管理下架成功，返回 code=0")
    void offlineDemand_success() throws Exception {
        doNothing().when(demandService).adminOffline(anyLong(), anyLong());

        demandMvc.perform(patch("/api/v1/admin/supply/demands/1/offline")
                        .header("X-Account-Id", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }
}
