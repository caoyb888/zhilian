package com.greenlink.glportal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.glportal.dto.request.BannerActiveRequest;
import com.greenlink.glportal.dto.request.CreateBannerRequest;
import com.greenlink.glportal.dto.response.BannerVO;
import com.greenlink.glportal.service.PortalBannerService;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * S3-13 接口自动化测试：门户轮播图模块（TC-S3-13-06 ~ TC-S3-13-08）
 */
@ExtendWith(MockitoExtension.class)
class PortalBannerControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Mock PortalBannerService bannerService;
    @InjectMocks PortalBannerController bannerController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(bannerController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-S3-13-06  GET /api/v1/portal/banners — 前台获取有效轮播图列表
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-S3-13-06 listActive — 返回有效轮播图列表，code=0 且条数正确")
    void tc06_listActive_returns200() throws Exception {
        BannerVO b1 = new BannerVO();
        b1.setId(1L);
        b1.setTitle("绿色低碳产业峰会2026");
        b1.setImageUrl("http://cdn.example.com/banner1.jpg");
        b1.setSortOrder(1);
        b1.setIsActive(1);

        BannerVO b2 = new BannerVO();
        b2.setId(2L);
        b2.setTitle("山东省绿色低碳产业发展规划");
        b2.setImageUrl("http://cdn.example.com/banner2.jpg");
        b2.setSortOrder(2);
        b2.setIsActive(1);

        when(bannerService.listActive()).thenReturn(List.of(b1, b2));

        mockMvc.perform(get("/api/v1/portal/banners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].id").value(1))
                .andExpect(jsonPath("$.data[0].title").value("绿色低碳产业峰会2026"))
                .andExpect(jsonPath("$.data[1].id").value(2));
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-S3-13-07  POST /api/v1/portal/banners — 创建新轮播图
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-S3-13-07 create — 合法请求创建轮播图，返回 code=0 及新增记录")
    void tc07_create_valid_banner_returns200() throws Exception {
        CreateBannerRequest req = new CreateBannerRequest();
        req.setTitle("绿色能源创新大会");
        req.setImageUrl("http://cdn.example.com/banner3.jpg");
        req.setLinkUrl("https://www.greenlink.com/activity/3");
        req.setSortOrder(3);
        req.setIsActive(1);

        BannerVO vo = new BannerVO();
        vo.setId(3L);
        vo.setTitle("绿色能源创新大会");
        vo.setImageUrl("http://cdn.example.com/banner3.jpg");
        vo.setLinkUrl("https://www.greenlink.com/activity/3");
        vo.setSortOrder(3);
        vo.setIsActive(1);

        when(bannerService.create(any(CreateBannerRequest.class))).thenReturn(vo);

        mockMvc.perform(post("/api/v1/portal/banners")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.id").value(3))
                .andExpect(jsonPath("$.data.title").value("绿色能源创新大会"))
                .andExpect(jsonPath("$.data.sortOrder").value(3));
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-S3-13-08  PATCH /api/v1/portal/banners/{id}/active — 切换轮播图启用状态
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-S3-13-08 updateActive — 将轮播图切换为禁用状态，返回 code=0")
    void tc08_updateActive_disable_returns200() throws Exception {
        BannerActiveRequest req = new BannerActiveRequest();
        req.setIsActive(0);

        doNothing().when(bannerService).updateActive(1L, 0);

        mockMvc.perform(patch("/api/v1/portal/banners/1/active")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data").doesNotExist());

        verify(bannerService).updateActive(1L, 0);
    }
}
