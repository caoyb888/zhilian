package com.greenlink.glportal.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glportal.dto.response.ActivityDetailVO;
import com.greenlink.glportal.dto.response.ActivitySignupStatusVO;
import com.greenlink.glportal.dto.response.ActivityVO;
import com.greenlink.glportal.service.PortalActivityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class PortalActivityPublicControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Mock PortalActivityService activityService;
    @InjectMocks PortalActivityPublicController controller;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    @DisplayName("TC-S3-04-01 公开活动列表 — 默认参数返回报名中和已结束活动")
    void publicPageList_defaultParams_returns200() throws Exception {
        ActivityVO vo = new ActivityVO();
        vo.setId(1L);
        vo.setTitle("2026绿色峰会");
        vo.setStatus(2);
        vo.setStartTime(LocalDateTime.of(2026, 7, 1, 9, 0));
        vo.setRegCount(20);

        Page<ActivityVO> page = new Page<>(1, 20);
        page.setRecords(List.of(vo));
        page.setTotal(1);

        when(activityService.publicPageList(any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/portal/public/activities")
                        .param("page", "1")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.records[0].title").value("2026绿色峰会"))
                .andExpect(jsonPath("$.data.records[0].status").value(2));
    }

    @Test
    @DisplayName("TC-S3-04-02 公开活动详情 — 存在且可见时返回详情")
    void publicGetById_exists_returns200() throws Exception {
        ActivityDetailVO detail = new ActivityDetailVO();
        detail.setId(1L);
        detail.setTitle("2026绿色峰会");
        detail.setStatus(2);
        detail.setContent("<p>活动详情...</p>");
        detail.setRegCount(20);

        when(activityService.publicGetById(1L)).thenReturn(detail);

        mockMvc.perform(get("/api/v1/portal/public/activities/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.content").value("<p>活动详情...</p>"));
    }

    @Test
    @DisplayName("TC-S3-04-03 公开活动详情 — 活动不存在或筹备中时返回业务错误码")
    void publicGetById_notVisible_returnsBizError() throws Exception {
        when(activityService.publicGetById(99L))
                .thenThrow(new BizException(ResultCode.ACTIVITY_NOT_FOUND));

        mockMvc.perform(get("/api/v1/portal/public/activities/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ResultCode.ACTIVITY_NOT_FOUND.getCode()));
    }

    @Test
    @DisplayName("TC-S3-04-04 报名状态查询 — 已登录且已报名，返回 signed=true")
    void getSignupStatus_signedUp_returns200() throws Exception {
        ActivitySignupStatusVO vo = new ActivitySignupStatusVO();
        vo.setSigned(true);
        vo.setSignupId(10L);
        vo.setSignupStatus(1);

        when(activityService.getSignupStatus(eq(1L), eq(100L))).thenReturn(vo);

        mockMvc.perform(get("/api/v1/portal/public/activities/1/my-signup")
                        .header("X-Account-Id", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.signed").value(true))
                .andExpect(jsonPath("$.data.signupId").value(10))
                .andExpect(jsonPath("$.data.signupStatus").value(1));
    }

    @Test
    @DisplayName("TC-S3-04-05 报名状态查询 — 未登录时返回 signed=false")
    void getSignupStatus_notLoggedIn_returnsNotSigned() throws Exception {
        ActivitySignupStatusVO vo = new ActivitySignupStatusVO();
        vo.setSigned(false);

        when(activityService.getSignupStatus(eq(1L), isNull())).thenReturn(vo);

        mockMvc.perform(get("/api/v1/portal/public/activities/1/my-signup"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.signed").value(false));
    }
}
