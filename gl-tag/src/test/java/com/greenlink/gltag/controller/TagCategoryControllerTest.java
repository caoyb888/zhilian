package com.greenlink.gltag.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.common.result.ResultCode;
import com.greenlink.gltag.dto.request.CreateTagCategoryRequest;
import com.greenlink.gltag.dto.response.TagCategoryVO;
import com.greenlink.gltag.service.TagCategoryService;
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
 * S2-14 接口自动化测试：标签分类模块（TC-06 ~ TC-08）
 */
@ExtendWith(MockitoExtension.class)
class TagCategoryControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock TagCategoryService tagCategoryService;
    @InjectMocks TagCategoryController tagCategoryController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(tagCategoryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-06  GET /api/v1/tag-categories — 返回全部标签分类列表
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-06 listTagCategories — 返回 code=0 及标签分类列表")
    void tc06_listAll_returns200() throws Exception {
        TagCategoryVO industry = new TagCategoryVO();
        industry.setId(1L);
        industry.setCode("INDUSTRY");
        industry.setName("行业分类");
        industry.setSortOrder(0);
        industry.setIsActive(true);

        TagCategoryVO resource = new TagCategoryVO();
        resource.setId(2L);
        resource.setCode("RESOURCE");
        resource.setName("资源类型");
        resource.setSortOrder(1);
        resource.setIsActive(true);

        when(tagCategoryService.listAll()).thenReturn(List.of(industry, resource));

        mockMvc.perform(get("/api/v1/tag-categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].code").value("INDUSTRY"))
                .andExpect(jsonPath("$.data[1].code").value("RESOURCE"));

        verify(tagCategoryService).listAll();
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-07  POST /api/v1/tag-categories — 合法请求，成功创建标签分类
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-07 createTagCategory — 合法请求，返回 code=0 及新建分类信息")
    void tc07_create_validRequest_returns200() throws Exception {
        CreateTagCategoryRequest req = new CreateTagCategoryRequest();
        req.setName("技术领域");
        req.setCode("TECH_FIELD");
        req.setSortOrder(5);

        TagCategoryVO created = new TagCategoryVO();
        created.setId(7L);
        created.setCode("TECH_FIELD");
        created.setName("技术领域");
        created.setSortOrder(5);
        created.setIsActive(true);
        when(tagCategoryService.create(any(CreateTagCategoryRequest.class))).thenReturn(created);

        mockMvc.perform(post("/api/v1/tag-categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.code").value("TECH_FIELD"))
                .andExpect(jsonPath("$.data.name").value("技术领域"))
                .andExpect(jsonPath("$.data.isActive").value(true));
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-08  POST /api/v1/tag-categories — name 字段为空，返回参数校验错误
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-08 createTagCategory — name 为空，返回 code=1001 参数错误")
    void tc08_create_blankName_returnsParamError() throws Exception {
        CreateTagCategoryRequest req = new CreateTagCategoryRequest();
        req.setName("");           // 违反 @NotBlank
        req.setCode("VALID_CODE");

        mockMvc.perform(post("/api/v1/tag-categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(ResultCode.PARAM_ERROR.getCode()));

        verify(tagCategoryService, never()).create(any());
    }
}
