package com.greenlink.glsupply.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.glsupply.dto.request.CreateResourceRequest;
import com.greenlink.glsupply.dto.response.ResourceDetailVO;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * S4-01 接口自动化测试：资源发布 Controller 层
 */
@ExtendWith(MockitoExtension.class)
class SupplyResourceControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Mock
    SupplyResourceService resourceService;
    @InjectMocks
    SupplyResourceController controller;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    // ─────────────────────────────────────────────
    // TC-01  POST /api/v1/supply/resources — 创建成功
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("POST /resources — 创建资源成功，返回 code=0")
    void create_success() throws Exception {
        ResourceDetailVO vo = new ResourceDetailVO();
        vo.setId(1L);
        vo.setTitle("光伏组件供应");
        vo.setAuditStatus(0);
        when(resourceService.create(any(), anyLong(), anyLong())).thenReturn(vo);

        CreateResourceRequest req = new CreateResourceRequest();
        req.setType("PRODUCT");
        req.setTitle("光伏组件供应");

        mockMvc.perform(post("/api/v1/supply/resources")
                        .header("X-Member-Id", "100")
                        .header("X-Account-Id", "200")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.title").value("光伏组件供应"))
                .andExpect(jsonPath("$.data.auditStatus").value(0));
    }

    // ─────────────────────────────────────────────
    // TC-02  POST /api/v1/supply/resources — 参数校验失败
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("POST /resources — 缺少 type 字段，返回参数校验错误")
    void create_missingType_paramError() throws Exception {
        CreateResourceRequest req = new CreateResourceRequest();
        req.setTitle("光伏组件供应");
        // type 为空

        mockMvc.perform(post("/api/v1/supply/resources")
                        .header("X-Member-Id", "100")
                        .header("X-Account-Id", "200")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1001));
    }

    // ─────────────────────────────────────────────
    // TC-03  GET /api/v1/supply/resources — 列表查询
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("GET /resources — 分页列表返回 code=0")
    void pageList_success() throws Exception {
        when(resourceService.pageList(any())).thenReturn(new Page<>(1, 20, 0));

        mockMvc.perform(get("/api/v1/supply/resources")
                        .param("page", "1")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    // ─────────────────────────────────────────────
    // TC-04  DELETE /api/v1/supply/resources/{id} — 删除成功
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("DELETE /resources/{id} — 软删除成功，返回 code=0")
    void delete_success() throws Exception {
        mockMvc.perform(delete("/api/v1/supply/resources/1")
                        .header("X-Account-Id", "200"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }
}
