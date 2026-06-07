package com.greenlink.glsupply.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.glsupply.dto.request.CreateDemandRequest;
import com.greenlink.glsupply.dto.request.UpdateDemandRequest;
import com.greenlink.glsupply.dto.response.DemandDetailVO;
import com.greenlink.glsupply.enums.AuditStatus;
import com.greenlink.glsupply.service.SupplyDemandService;
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

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * S4-14 接口自动化测试：需求 Controller 层（10 个用例）
 */
@ExtendWith(MockitoExtension.class)
class SupplyDemandControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Mock
    SupplyDemandService demandService;

    @InjectMocks
    SupplyDemandController controller;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    // ─────────────────────────────────────────────
    // TC-01  POST /supply/demands — 创建需求成功
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-01 POST /demands — 创建需求成功，返回 code=0，状态为待审核")
    void create_success() throws Exception {
        DemandDetailVO vo = new DemandDetailVO();
        vo.setId(1L);
        vo.setType("PRODUCT");
        vo.setTitle("急需光伏组件采购");
        vo.setAuditStatus(AuditStatus.PENDING.getCode());
        vo.setBudgetMin(new BigDecimal("50.00"));
        vo.setBudgetMax(new BigDecimal("200.00"));
        when(demandService.create(any(), anyLong(), anyLong())).thenReturn(vo);

        CreateDemandRequest req = new CreateDemandRequest();
        req.setType("PRODUCT");
        req.setTitle("急需光伏组件采购");
        req.setBudgetMin(new BigDecimal("50.00"));
        req.setBudgetMax(new BigDecimal("200.00"));

        mockMvc.perform(post("/api/v1/supply/demands")
                        .header("X-Member-Id", "100")
                        .header("X-Account-Id", "200")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.title").value("急需光伏组件采购"))
                .andExpect(jsonPath("$.data.auditStatus").value(0))
                .andExpect(jsonPath("$.data.budgetMin").value(50.00));
    }

    // ─────────────────────────────────────────────
    // TC-02  POST /supply/demands — 缺少 title 字段
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-02 POST /demands — 缺少 title，参数校验失败，返回 code=1001")
    void create_missingTitle_paramError() throws Exception {
        CreateDemandRequest req = new CreateDemandRequest();
        req.setType("PRODUCT");
        // title 为空

        mockMvc.perform(post("/api/v1/supply/demands")
                        .header("X-Member-Id", "100")
                        .header("X-Account-Id", "200")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    // ─────────────────────────────────────────────
    // TC-03  POST /supply/demands — 缺少 type 字段
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-03 POST /demands — 缺少 type，参数校验失败，返回 code=1001")
    void create_missingType_paramError() throws Exception {
        CreateDemandRequest req = new CreateDemandRequest();
        req.setTitle("急需光伏组件采购");
        // type 为空

        mockMvc.perform(post("/api/v1/supply/demands")
                        .header("X-Member-Id", "100")
                        .header("X-Account-Id", "200")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    // ─────────────────────────────────────────────
    // TC-04  GET /supply/demands — 分页列表
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-04 GET /demands — 分页列表返回 code=0")
    void pageList_success() throws Exception {
        when(demandService.pageList(any())).thenReturn(new Page<>(1, 20, 0));

        mockMvc.perform(get("/api/v1/supply/demands")
                        .param("page", "1")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    // ─────────────────────────────────────────────
    // TC-05  GET /supply/demands/{id} — 查询详情
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-05 GET /demands/{id} — 查询详情成功，返回 code=0 含预算字段")
    void getById_success() throws Exception {
        DemandDetailVO vo = new DemandDetailVO();
        vo.setId(1L);
        vo.setTitle("急需光伏组件采购");
        vo.setType("PRODUCT");
        vo.setAuditStatus(AuditStatus.APPROVED.getCode());
        vo.setBudgetMin(new BigDecimal("50.00"));
        vo.setBudgetMax(new BigDecimal("200.00"));
        vo.setAttachments(List.of());
        vo.setTags(List.of());
        when(demandService.getById(1L)).thenReturn(vo);

        mockMvc.perform(get("/api/v1/supply/demands/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.title").value("急需光伏组件采购"))
                .andExpect(jsonPath("$.data.auditStatus").value(1))
                .andExpect(jsonPath("$.data.budgetMax").value(200.00));
    }

    // ─────────────────────────────────────────────
    // TC-06  PUT /supply/demands/{id} — 更新需求
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-06 PUT /demands/{id} — 更新成功，返回 code=0，状态重置为待审核")
    void update_success() throws Exception {
        DemandDetailVO vo = new DemandDetailVO();
        vo.setId(1L);
        vo.setTitle("更新后的需求标题");
        vo.setAuditStatus(AuditStatus.PENDING.getCode());
        when(demandService.update(anyLong(), any(), anyLong())).thenReturn(vo);

        UpdateDemandRequest req = new UpdateDemandRequest();
        req.setTitle("更新后的需求标题");

        mockMvc.perform(put("/api/v1/supply/demands/1")
                        .header("X-Account-Id", "200")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.title").value("更新后的需求标题"))
                .andExpect(jsonPath("$.data.auditStatus").value(0));
    }

    // ─────────────────────────────────────────────
    // TC-07  DELETE /supply/demands/{id} — 软删除
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-07 DELETE /demands/{id} — 软删除成功，返回 code=0")
    void delete_success() throws Exception {
        doNothing().when(demandService).delete(anyLong(), anyLong());

        mockMvc.perform(delete("/api/v1/supply/demands/1")
                        .header("X-Account-Id", "200"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    // ─────────────────────────────────────────────
    // TC-08  PATCH /supply/demands/{id}/close — 关闭需求
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-08 PATCH /demands/{id}/close — 关闭成功，返回 code=0")
    void close_success() throws Exception {
        doNothing().when(demandService).close(anyLong(), anyLong());

        mockMvc.perform(patch("/api/v1/supply/demands/1/close")
                        .header("X-Account-Id", "200"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    // ─────────────────────────────────────────────
    // TC-09  GET /supply/demands/mine — 我的需求列表
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-09 GET /demands/mine — 我的需求列表，返回 code=0")
    void mine_success() throws Exception {
        when(demandService.minePageList(anyLong(), any())).thenReturn(new Page<>(1, 15, 0));

        mockMvc.perform(get("/api/v1/supply/demands/mine")
                        .header("X-Member-Id", "100")
                        .param("page", "1")
                        .param("size", "15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    // ─────────────────────────────────────────────
    // TC-10  GET /supply/demands — 带类型筛选参数
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-10 GET /demands?type=TECHNOLOGY — 类型筛选参数透传，返回 code=0")
    void pageList_withTypeFilter_success() throws Exception {
        when(demandService.pageList(any())).thenReturn(new Page<>(1, 20, 3));

        mockMvc.perform(get("/api/v1/supply/demands")
                        .param("page", "1")
                        .param("size", "20")
                        .param("type", "TECHNOLOGY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }
}
