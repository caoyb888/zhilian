package com.greenlink.glportal.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.glportal.domain.PortalCategory;
import com.greenlink.glportal.dto.request.CreateCategoryRequest;
import com.greenlink.glportal.dto.request.UpdateCategoryRequest;
import com.greenlink.glportal.dto.response.CategoryVO;
import com.greenlink.glportal.repository.PortalArticleMapper;
import com.greenlink.glportal.repository.PortalCategoryMapper;
import com.greenlink.glportal.service.impl.PortalCategoryServiceImpl;
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
class PortalCategoryServiceTest {

    @Mock
    PortalCategoryMapper categoryMapper;
    @Mock
    PortalArticleMapper articleMapper;

    @InjectMocks
    PortalCategoryServiceImpl service;

    private PortalCategory existingCategory;

    @BeforeEach
    void setUp() {
        existingCategory = new PortalCategory();
        existingCategory.setId(1L);
        existingCategory.setParentId(null);
        existingCategory.setName("新闻资讯");
        existingCategory.setCode("NEWS");
        existingCategory.setSortOrder(0);
        existingCategory.setIsVisible(1);
    }

    @Test
    void listTree_rootAndChild_buildsTree() {
        PortalCategory child = new PortalCategory();
        child.setId(2L);
        child.setParentId(1L);
        child.setName("行业新闻");
        child.setCode("NEWS_INDUSTRY");
        child.setSortOrder(0);
        child.setIsVisible(1);

        when(categoryMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(existingCategory, child));

        List<CategoryVO> tree = service.listTree();

        assertThat(tree).hasSize(1);
        assertThat(tree.get(0).getCode()).isEqualTo("NEWS");
        assertThat(tree.get(0).getChildren()).hasSize(1);
        assertThat(tree.get(0).getChildren().get(0).getCode()).isEqualTo("NEWS_INDUSTRY");
    }

    @Test
    void getById_found_returnsVO() {
        when(categoryMapper.selectById(1L)).thenReturn(existingCategory);

        CategoryVO vo = service.getById(1L);

        assertThat(vo.getId()).isEqualTo(1L);
        assertThat(vo.getName()).isEqualTo("新闻资讯");
        assertThat(vo.getIsVisible()).isTrue();
    }

    @Test
    void getById_notFound_throwsBizException() {
        when(categoryMapper.selectById(999L)).thenReturn(null);

        assertThatThrownBy(() -> service.getById(999L))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("栏目不存在");
    }

    @Test
    void create_success() {
        when(categoryMapper.findIdByCode("POLICY")).thenReturn(null);
        when(categoryMapper.insert(any(PortalCategory.class))).thenReturn(1);

        CreateCategoryRequest req = new CreateCategoryRequest();
        req.setName("政策法规");
        req.setCode("POLICY");
        req.setSortOrder(2);

        CategoryVO result = service.create(req);

        assertThat(result.getCode()).isEqualTo("POLICY");
        assertThat(result.getName()).isEqualTo("政策法规");
        assertThat(result.getIsVisible()).isTrue();
        verify(categoryMapper).insert(any(PortalCategory.class));
    }

    @Test
    void create_duplicateCode_throwsBizException() {
        when(categoryMapper.findIdByCode("NEWS")).thenReturn(1L);

        CreateCategoryRequest req = new CreateCategoryRequest();
        req.setName("新闻2");
        req.setCode("NEWS");

        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("栏目编码已存在");
    }

    @Test
    void create_invalidParent_throwsBizException() {
        when(categoryMapper.findIdByCode("SUB")).thenReturn(null);
        when(categoryMapper.selectById(99L)).thenReturn(null);

        CreateCategoryRequest req = new CreateCategoryRequest();
        req.setName("子栏目");
        req.setCode("SUB");
        req.setParentId(99L);

        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("父栏目不存在");
    }

    @Test
    void update_success() {
        when(categoryMapper.selectById(1L)).thenReturn(existingCategory);
        when(categoryMapper.updateById(any(PortalCategory.class))).thenReturn(1);

        UpdateCategoryRequest req = new UpdateCategoryRequest();
        req.setName("新闻资讯（更新）");
        req.setSortOrder(5);
        req.setIsVisible(false);

        CategoryVO result = service.update(1L, req);

        assertThat(result.getName()).isEqualTo("新闻资讯（更新）");
        assertThat(result.getSortOrder()).isEqualTo(5);
        assertThat(result.getIsVisible()).isFalse();
        verify(categoryMapper).updateById(any(PortalCategory.class));
    }

    @Test
    void update_notFound_throwsBizException() {
        when(categoryMapper.selectById(999L)).thenReturn(null);

        assertThatThrownBy(() -> service.update(999L, new UpdateCategoryRequest()))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("栏目不存在");
    }

    @Test
    void delete_withChildren_throwsBizException() {
        when(categoryMapper.selectById(1L)).thenReturn(existingCategory);
        when(categoryMapper.countChildren(1L)).thenReturn(2L);

        assertThatThrownBy(() -> service.delete(1L))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("子栏目");
    }

    @Test
    void delete_withArticles_throwsBizException() {
        when(categoryMapper.selectById(1L)).thenReturn(existingCategory);
        when(categoryMapper.countChildren(1L)).thenReturn(0L);
        when(articleMapper.countByCategory(1L)).thenReturn(3L);

        assertThatThrownBy(() -> service.delete(1L))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("文章");
    }

    @Test
    void delete_noChildren_noArticles_success() {
        when(categoryMapper.selectById(1L)).thenReturn(existingCategory);
        when(categoryMapper.countChildren(1L)).thenReturn(0L);
        when(articleMapper.countByCategory(1L)).thenReturn(0L);

        service.delete(1L);

        verify(categoryMapper).deleteById(1L);
    }
}
