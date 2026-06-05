package com.greenlink.gltag.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.gltag.domain.Tag;
import com.greenlink.gltag.domain.TagCategory;
import com.greenlink.gltag.dto.request.CreateTagCategoryRequest;
import com.greenlink.gltag.dto.request.UpdateTagCategoryRequest;
import com.greenlink.gltag.dto.response.TagCategoryVO;
import com.greenlink.gltag.helper.TagTreeCacheHelper;
import com.greenlink.gltag.repository.TagCategoryMapper;
import com.greenlink.gltag.repository.TagMapper;
import com.greenlink.gltag.service.impl.TagCategoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TagCategoryServiceTest {

    @Mock TagCategoryMapper categoryMapper;
    @Mock TagMapper tagMapper;
    @Mock TagTreeCacheHelper cacheHelper;

    @InjectMocks TagCategoryServiceImpl service;

    private TagCategory existingCategory;

    @BeforeEach
    void setUp() {
        existingCategory = new TagCategory();
        existingCategory.setId(1L);
        existingCategory.setName("行业分类");
        existingCategory.setCode("INDUSTRY");
        existingCategory.setSortOrder(0);
        existingCategory.setIsActive(1);
    }

    // ── cache behavior ──────────────────────────────────────────────────────

    @Test
    void listAll_cacheHit_skipsDb() {
        TagCategoryVO vo = new TagCategoryVO();
        vo.setCode("INDUSTRY");
        when(cacheHelper.get()).thenReturn(List.of(vo));

        List<TagCategoryVO> result = service.listAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCode()).isEqualTo("INDUSTRY");
        verifyNoInteractions(categoryMapper, tagMapper);
        verify(cacheHelper, never()).set(any());
    }

    @Test
    void listAll_cacheMiss_queriesDbAndSetsCache() {
        when(cacheHelper.get()).thenReturn(null);
        when(categoryMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(existingCategory));
        when(tagMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

        List<TagCategoryVO> result = service.listAll();

        assertThat(result).hasSize(1);
        verify(categoryMapper).selectList(any());
        verify(cacheHelper).set(result);
    }

    @Test
    void create_evictsCache() {
        when(categoryMapper.findIdByCode("NEW")).thenReturn(null);
        when(categoryMapper.insert(any(TagCategory.class))).thenReturn(1);

        CreateTagCategoryRequest req = new CreateTagCategoryRequest();
        req.setName("新分类");
        req.setCode("NEW");

        service.create(req);

        verify(cacheHelper).evict();
    }

    @Test
    void update_evictsCache() {
        when(categoryMapper.selectById(1L)).thenReturn(existingCategory);
        when(categoryMapper.updateById(any(TagCategory.class))).thenReturn(1);

        UpdateTagCategoryRequest req = new UpdateTagCategoryRequest();
        req.setName("更新名称");

        service.update(1L, req);

        verify(cacheHelper).evict();
    }

    @Test
    void delete_evictsCache() {
        when(categoryMapper.selectById(1L)).thenReturn(existingCategory);
        when(tagMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        service.delete(1L);

        verify(cacheHelper).evict();
    }

    // ── business logic (unchanged) ──────────────────────────────────────────

    @Test
    void create_success() {
        when(categoryMapper.findIdByCode("TECH_FIELD")).thenReturn(null);
        when(categoryMapper.insert(any(TagCategory.class))).thenReturn(1);

        CreateTagCategoryRequest req = new CreateTagCategoryRequest();
        req.setName("技术领域");
        req.setCode("TECH_FIELD");
        req.setSortOrder(1);

        TagCategoryVO result = service.create(req);

        assertThat(result.getCode()).isEqualTo("TECH_FIELD");
        assertThat(result.getName()).isEqualTo("技术领域");
        assertThat(result.getIsActive()).isTrue();
        verify(categoryMapper).insert(any(TagCategory.class));
    }

    @Test
    void create_duplicateCode_throwsBizException() {
        when(categoryMapper.findIdByCode("INDUSTRY")).thenReturn(1L);

        CreateTagCategoryRequest req = new CreateTagCategoryRequest();
        req.setName("行业分类2");
        req.setCode("INDUSTRY");

        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("分类编码已存在");
    }

    @Test
    void update_success() {
        when(categoryMapper.selectById(1L)).thenReturn(existingCategory);
        when(categoryMapper.updateById(any(TagCategory.class))).thenReturn(1);

        UpdateTagCategoryRequest req = new UpdateTagCategoryRequest();
        req.setName("行业分类（更新）");
        req.setSortOrder(5);

        TagCategoryVO result = service.update(1L, req);

        assertThat(result.getName()).isEqualTo("行业分类（更新）");
        assertThat(result.getSortOrder()).isEqualTo(5);
        verify(categoryMapper).updateById(any(TagCategory.class));
    }

    @Test
    void update_notFound_throwsBizException() {
        when(categoryMapper.selectById(999L)).thenReturn(null);

        UpdateTagCategoryRequest req = new UpdateTagCategoryRequest();
        req.setName("不存在");

        assertThatThrownBy(() -> service.update(999L, req))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("标签分类不存在");
    }

    @Test
    void delete_withTags_throwsBizException() {
        when(categoryMapper.selectById(1L)).thenReturn(existingCategory);
        when(tagMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(3L);

        assertThatThrownBy(() -> service.delete(1L))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("分类下存在标签");
    }

    @Test
    void delete_emptyCategory_success() {
        when(categoryMapper.selectById(1L)).thenReturn(existingCategory);
        when(tagMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        service.delete(1L);

        verify(categoryMapper).deleteById(1L);
    }
}
