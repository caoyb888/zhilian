package com.greenlink.gltag.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.exception.BizException;
import com.greenlink.gltag.domain.Tag;
import com.greenlink.gltag.domain.TagCategory;
import com.greenlink.gltag.dto.request.CreateTagRequest;
import com.greenlink.gltag.dto.request.UpdateTagRequest;
import com.greenlink.gltag.dto.response.TagVO;
import com.greenlink.gltag.repository.TagCategoryMapper;
import com.greenlink.gltag.repository.TagMapper;
import com.greenlink.gltag.service.impl.TagServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TagServiceTest {

    @Mock TagMapper tagMapper;
    @Mock TagCategoryMapper categoryMapper;

    @InjectMocks TagServiceImpl service;

    private TagCategory category;
    private Tag existingTag;

    @BeforeEach
    void setUp() {
        category = new TagCategory();
        category.setId(1L);
        category.setCode("INDUSTRY");
        category.setName("行业分类");

        existingTag = new Tag();
        existingTag.setId(10L);
        existingTag.setCategoryId(1L);
        existingTag.setName("新能源");
        existingTag.setIsActive(1);
        existingTag.setIsDeleted(0);
        existingTag.setSortOrder(0);
    }

    @Test
    void create_success() {
        when(categoryMapper.selectById(1L)).thenReturn(category);
        when(tagMapper.findIdByNameAndCategory("光伏", 1L)).thenReturn(null);
        when(tagMapper.insert(any(Tag.class))).thenReturn(1);

        CreateTagRequest req = new CreateTagRequest();
        req.setCategoryId(1L);
        req.setName("光伏");
        req.setAlias("光伏发电,PV");

        TagVO result = service.create(req);

        assertThat(result.getName()).isEqualTo("光伏");
        assertThat(result.getCategoryCode()).isEqualTo("INDUSTRY");
        verify(tagMapper).insert(any(Tag.class));
    }

    @Test
    void create_categoryNotFound_throwsBizException() {
        when(categoryMapper.selectById(999L)).thenReturn(null);

        CreateTagRequest req = new CreateTagRequest();
        req.setCategoryId(999L);
        req.setName("光伏");

        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("标签分类不存在");
    }

    @Test
    void create_duplicateName_throwsBizException() {
        when(categoryMapper.selectById(1L)).thenReturn(category);
        when(tagMapper.findIdByNameAndCategory("新能源", 1L)).thenReturn(10L);

        CreateTagRequest req = new CreateTagRequest();
        req.setCategoryId(1L);
        req.setName("新能源");

        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("标签名称已存在");
    }

    @Test
    void getById_notFound_throwsBizException() {
        when(tagMapper.selectById(999L)).thenReturn(null);

        assertThatThrownBy(() -> service.getById(999L))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("标签不存在");
    }

    @Test
    void update_success() {
        when(tagMapper.selectById(10L)).thenReturn(existingTag);
        when(tagMapper.findIdByNameAndCategory("风能", 1L)).thenReturn(null);
        when(tagMapper.updateById(any(Tag.class))).thenReturn(1);
        when(categoryMapper.selectById(1L)).thenReturn(category);

        UpdateTagRequest req = new UpdateTagRequest();
        req.setName("风能");

        TagVO result = service.update(10L, req);

        assertThat(result.getName()).isEqualTo("风能");
        verify(tagMapper).updateById(any(Tag.class));
    }

    @Test
    void delete_success() {
        when(tagMapper.selectById(10L)).thenReturn(existingTag);

        service.delete(10L);

        verify(tagMapper).deleteById(10L);
    }
}
