package com.greenlink.gltag.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.gltag.dto.request.CreateTagRequest;
import com.greenlink.gltag.dto.response.TagVO;
import com.greenlink.gltag.service.TagService;
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
 * S2-14 接口自动化测试：标签模块（TC-09 ~ TC-10）
 */
@ExtendWith(MockitoExtension.class)
class TagControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock TagService tagService;
    @InjectMocks TagController tagController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(tagController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-09  GET /api/v1/tags — 按分类 ID 分页查询标签
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-09 listTags — 按分类 ID 分页查询，返回 code=0 及分页结果")
    void tc09_list_withCategoryFilter_returns200() throws Exception {
        TagVO tag1 = new TagVO();
        tag1.setId(1L); tag1.setCategoryId(1L); tag1.setName("光伏发电"); tag1.setIsActive(true);

        TagVO tag2 = new TagVO();
        tag2.setId(2L); tag2.setCategoryId(1L); tag2.setName("风力发电"); tag2.setIsActive(true);

        Page<TagVO> page = new Page<>(1, 10);
        page.setRecords(List.of(tag1, tag2));
        page.setTotal(2);

        when(tagService.list(eq(1L), isNull(), anyInt(), anyInt())).thenReturn(page);

        mockMvc.perform(get("/api/v1/tags")
                        .param("categoryId", "1")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.total").value(2))
                .andExpect(jsonPath("$.data.records[0].name").value("光伏发电"))
                .andExpect(jsonPath("$.data.records[1].name").value("风力发电"));
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-10  POST /api/v1/tags — 合法请求，成功创建标签
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-10 createTag — 合法请求，返回 code=0 及新建标签信息")
    void tc10_create_validRequest_returns200() throws Exception {
        CreateTagRequest req = new CreateTagRequest();
        req.setCategoryId(1L);
        req.setName("储能技术");
        req.setAlias("电池储能,飞轮储能");
        req.setSortOrder(0);

        TagVO created = new TagVO();
        created.setId(10L); created.setCategoryId(1L);
        created.setName("储能技术"); created.setAlias("电池储能,飞轮储能"); created.setIsActive(true);
        when(tagService.create(any(CreateTagRequest.class))).thenReturn(created);

        mockMvc.perform(post("/api/v1/tags")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.name").value("储能技术"))
                .andExpect(jsonPath("$.data.alias").value("电池储能,飞轮储能"))
                .andExpect(jsonPath("$.data.isActive").value(true));
    }
}
