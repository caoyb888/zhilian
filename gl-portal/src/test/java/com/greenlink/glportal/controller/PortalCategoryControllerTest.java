package com.greenlink.glportal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.glportal.dto.request.CreateCategoryRequest;
import com.greenlink.glportal.dto.response.CategoryVO;
import com.greenlink.glportal.service.PortalCategoryService;
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
 * S2-14 接口自动化测试：门户栏目模块（TC-11 ~ TC-12）
 */
@ExtendWith(MockitoExtension.class)
class PortalCategoryControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock PortalCategoryService categoryService;
    @InjectMocks PortalCategoryController portalCategoryController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(portalCategoryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-11  GET /api/v1/portal-categories — 返回门户栏目树
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-11 listPortalCategories — 返回 code=0 及门户栏目树")
    void tc11_listTree_returns200() throws Exception {
        CategoryVO news = new CategoryVO();
        news.setId(1L); news.setCode("NEWS"); news.setName("协会新闻");
        news.setSortOrder(1); news.setIsVisible(true); news.setChildren(List.of());

        CategoryVO notice = new CategoryVO();
        notice.setId(2L); notice.setCode("NOTICE"); notice.setName("通知公告");
        notice.setSortOrder(2); notice.setIsVisible(true); notice.setChildren(List.of());

        when(categoryService.listTree()).thenReturn(List.of(news, notice));

        mockMvc.perform(get("/api/v1/portal-categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].code").value("NEWS"))
                .andExpect(jsonPath("$.data[1].code").value("NOTICE"));

        verify(categoryService).listTree();
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-12  POST /api/v1/portal-categories — 合法请求，成功创建门户栏目
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-12 createPortalCategory — 合法请求，返回 code=0 及新建栏目信息")
    void tc12_create_validRequest_returns200() throws Exception {
        CreateCategoryRequest req = new CreateCategoryRequest();
        req.setName("政策法规");
        req.setCode("POLICY");
        req.setSortOrder(3);
        req.setIsVisible(true);

        CategoryVO created = new CategoryVO();
        created.setId(3L); created.setCode("POLICY"); created.setName("政策法规");
        created.setSortOrder(3); created.setIsVisible(true); created.setChildren(List.of());
        when(categoryService.create(any(CreateCategoryRequest.class))).thenReturn(created);

        mockMvc.perform(post("/api/v1/portal-categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.code").value("POLICY"))
                .andExpect(jsonPath("$.data.name").value("政策法规"))
                .andExpect(jsonPath("$.data.isVisible").value(true));
    }
}
