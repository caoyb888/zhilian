package com.greenlink.glportal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glportal.dto.response.ArticleDetailVO;
import com.greenlink.glportal.service.PortalArticleService;
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

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * S3-13 接口自动化测试：门户文章前台详情（TC-S3-13-09 ~ TC-S3-13-10）
 */
@ExtendWith(MockitoExtension.class)
class PortalArticleDetailControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Mock PortalArticleService articleService;
    @InjectMocks PortalArticleController articleController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(articleController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-S3-13-09  GET /api/v1/portal/articles/{id} — 已发布文章详情
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-S3-13-09 getById — 已发布文章，返回 code=0 及正文内容")
    void tc09_getById_published_article_returns200() throws Exception {
        ArticleDetailVO detail = new ArticleDetailVO();
        detail.setId(5L);
        detail.setCategoryId(1L);
        detail.setCategoryName("协会新闻");
        detail.setTitle("山东省绿色低碳产业协会荣获先进单位称号");
        detail.setSummary("山东省绿色低碳产业协会在年度评优中荣获先进单位称号。");
        detail.setContent("<p>详细报道正文...</p>");
        detail.setAuthor("秘书处");
        detail.setIsPublished(true);
        detail.setIsTop(true);
        detail.setViewCount(520);
        detail.setPublishedAt(LocalDateTime.of(2026, 6, 1, 10, 0));
        detail.setSourceUrl("https://www.shandong.gov.cn/news/5");

        when(articleService.getById(5L)).thenReturn(detail);

        mockMvc.perform(get("/api/v1/portal/articles/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.id").value(5))
                .andExpect(jsonPath("$.data.title").value("山东省绿色低碳产业协会荣获先进单位称号"))
                .andExpect(jsonPath("$.data.content").value("<p>详细报道正文...</p>"))
                .andExpect(jsonPath("$.data.isPublished").value(true))
                .andExpect(jsonPath("$.data.isTop").value(true))
                .andExpect(jsonPath("$.data.viewCount").value(520));
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-S3-13-10  GET /api/v1/portal/articles/{id} — 文章不存在或为草稿，返回 code=4001
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-S3-13-10 getById — 文章不存在或未发布草稿，返回业务错误码 4001")
    void tc10_getById_not_found_or_draft_returns4001() throws Exception {
        when(articleService.getById(999L))
                .thenThrow(new BizException(ResultCode.ARTICLE_NOT_FOUND));

        mockMvc.perform(get("/api/v1/portal/articles/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ResultCode.ARTICLE_NOT_FOUND.getCode()))
                .andExpect(jsonPath("$.data").doesNotExist());

        verify(articleService).getById(999L);
    }
}
