package com.greenlink.glportal.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.glportal.dto.request.CreateArticleRequest;
import com.greenlink.glportal.dto.response.ArticleDetailVO;
import com.greenlink.glportal.dto.response.ArticleVO;
import com.greenlink.glportal.enums.PublishMode;
import com.greenlink.glportal.service.PortalArticleService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * S2-14 接口自动化测试：门户文章模块（TC-13 ~ TC-15）
 */
@ExtendWith(MockitoExtension.class)
class PortalArticleControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Mock PortalArticleService articleService;
    @InjectMocks PortalArticleController portalArticleController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(portalArticleController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-13  GET /api/v1/portal/articles — 分页查询文章列表
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-13 listArticles — 带分页参数查询，返回 code=0 及分页结构")
    void tc13_pageList_returns200() throws Exception {
        ArticleVO article = new ArticleVO();
        article.setId(1L);
        article.setCategoryId(1L);
        article.setCategoryName("协会新闻");
        article.setTitle("山东省绿色低碳产业协会2026年工作会议顺利召开");
        article.setAuthor("秘书处");
        article.setIsPublished(true);
        article.setIsTop(false);
        article.setViewCount(128);
        article.setPublishedAt(LocalDateTime.of(2026, 6, 1, 9, 0));

        Page<ArticleVO> page = new Page<>(1, 10);
        page.setRecords(List.of(article));
        page.setTotal(1);

        when(articleService.pageList(any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/portal/articles")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.records[0].title")
                        .value("山东省绿色低碳产业协会2026年工作会议顺利召开"))
                .andExpect(jsonPath("$.data.records[0].isPublished").value(true));
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-14  POST /api/v1/portal/articles — 合法请求，立即发布文章
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-14 createArticle — 合法请求立即发布，返回 code=0 及文章详情")
    void tc14_create_validRequest_returns200() throws Exception {
        CreateArticleRequest req = new CreateArticleRequest();
        req.setCategoryId(1L);
        req.setTitle("2026年山东省绿色低碳产业发展白皮书发布");
        req.setContent("<p>正文内容...</p>");
        req.setSummary("白皮书深入分析了山东省绿色低碳产业现状与发展趋势。");
        req.setAuthor("研究中心");
        req.setPublishMode(PublishMode.NOW);
        req.setIsTop(false);

        ArticleDetailVO detail = new ArticleDetailVO();
        detail.setId(100L);
        detail.setCategoryId(1L);
        detail.setCategoryName("协会新闻");
        detail.setTitle("2026年山东省绿色低碳产业发展白皮书发布");
        detail.setSummary("白皮书深入分析了山东省绿色低碳产业现状与发展趋势。");
        detail.setAuthor("研究中心");
        detail.setIsPublished(true);
        detail.setIsTop(false);
        detail.setViewCount(0);
        detail.setContent("<p>正文内容...</p>");
        when(articleService.create(any(CreateArticleRequest.class), isNull())).thenReturn(detail);

        mockMvc.perform(post("/api/v1/portal/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.id").value(100))
                .andExpect(jsonPath("$.data.isPublished").value(true))
                .andExpect(jsonPath("$.data.content").value("<p>正文内容...</p>"));
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-15  PATCH /api/v1/portal/articles/{id}/publish — 发布草稿文章
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-15 publishArticle — 发布草稿文章，返回 code=0")
    void tc15_publish_returns200() throws Exception {
        doNothing().when(articleService).publish(50L);

        mockMvc.perform(patch("/api/v1/portal/articles/50/publish"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data").doesNotExist());

        verify(articleService).publish(50L);
    }
}
