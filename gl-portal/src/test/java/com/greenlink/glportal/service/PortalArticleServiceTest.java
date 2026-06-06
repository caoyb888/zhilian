package com.greenlink.glportal.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.glportal.domain.PortalArticle;
import com.greenlink.glportal.domain.PortalCategory;
import com.greenlink.glportal.dto.request.CreateArticleRequest;
import com.greenlink.glportal.dto.request.UpdateArticleRequest;
import com.greenlink.glportal.dto.response.ArticleDetailVO;
import com.greenlink.glportal.enums.PublishMode;
import com.greenlink.glportal.es.ArticleEsSyncService;
import com.greenlink.glportal.helper.ViewCountHelper;
import com.greenlink.glportal.mq.ArticleEventProducer;
import com.greenlink.glportal.repository.PortalArticleMapper;
import com.greenlink.glportal.repository.PortalCategoryMapper;
import com.greenlink.glportal.service.impl.PortalArticleServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PortalArticleServiceTest {

    @Mock PortalArticleMapper articleMapper;
    @Mock PortalCategoryMapper categoryMapper;
    @Mock ViewCountHelper viewCountHelper;
    @Mock ArticleEventProducer eventProducer;
    @Mock ArticleEsSyncService esSyncService;

    @InjectMocks PortalArticleServiceImpl service;

    private PortalCategory category;
    private PortalArticle existingArticle;

    @BeforeEach
    void setUp() {
        category = new PortalCategory();
        category.setId(1L);
        category.setName("新闻资讯");
        category.setCode("NEWS");

        existingArticle = new PortalArticle();
        existingArticle.setId(10L);
        existingArticle.setCategoryId(1L);
        existingArticle.setTitle("测试文章");
        existingArticle.setContent("<p>正文内容</p>");
        existingArticle.setIsTop(0);
        existingArticle.setIsPublished(0);
        existingArticle.setViewCount(100);
    }

    @Test
    void create_draft_success() {
        when(categoryMapper.selectById(1L)).thenReturn(category);
        when(articleMapper.insert(any(PortalArticle.class))).thenReturn(1);

        CreateArticleRequest req = buildRequest(PublishMode.DRAFT, null);
        ArticleDetailVO result = service.create(req, 99L);

        assertThat(result.getIsPublished()).isFalse();
        assertThat(result.getPublishedAt()).isNull();
        verify(articleMapper).insert(any(PortalArticle.class));
    }

    @Test
    void create_publishNow_success() {
        when(categoryMapper.selectById(1L)).thenReturn(category);
        when(articleMapper.insert(any(PortalArticle.class))).thenReturn(1);

        CreateArticleRequest req = buildRequest(PublishMode.NOW, null);
        ArticleDetailVO result = service.create(req, 99L);

        assertThat(result.getIsPublished()).isTrue();
        assertThat(result.getPublishedAt()).isNotNull();
    }

    @Test
    void create_scheduled_success() {
        when(categoryMapper.selectById(1L)).thenReturn(category);
        when(articleMapper.insert(any(PortalArticle.class))).thenReturn(1);

        LocalDateTime future = LocalDateTime.now().plusDays(1);
        CreateArticleRequest req = buildRequest(PublishMode.SCHEDULED, future);
        ArticleDetailVO result = service.create(req, null);

        assertThat(result.getIsPublished()).isFalse();
        assertThat(result.getPublishedAt()).isEqualTo(future);
    }

    @Test
    void create_scheduled_withoutScheduledAt_throwsBizException() {
        when(categoryMapper.selectById(1L)).thenReturn(category);

        CreateArticleRequest req = buildRequest(PublishMode.SCHEDULED, null);

        assertThatThrownBy(() -> service.create(req, null))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("scheduledAt");
    }

    @Test
    void create_xssContent_sanitized() {
        when(categoryMapper.selectById(1L)).thenReturn(category);
        when(articleMapper.insert(any(PortalArticle.class))).thenAnswer(inv -> {
            PortalArticle a = inv.getArgument(0);
            assertThat(a.getContent()).doesNotContain("<script>");
            return 1;
        });

        CreateArticleRequest req = buildRequest(PublishMode.DRAFT, null);
        req.setContent("<p>正文</p><script>alert(1)</script>");
        service.create(req, null);
    }

    @Test
    void update_success() {
        when(articleMapper.selectById(10L)).thenReturn(existingArticle);
        when(articleMapper.updateById(any(PortalArticle.class))).thenReturn(1);

        UpdateArticleRequest req = new UpdateArticleRequest();
        req.setTitle("更新后标题");
        req.setIsTop(true);

        ArticleDetailVO result = service.update(10L, req);

        assertThat(result.getTitle()).isEqualTo("更新后标题");
        assertThat(result.getIsTop()).isTrue();
        verify(articleMapper).updateById(any(PortalArticle.class));
    }

    @Test
    void delete_success() {
        when(articleMapper.selectById(10L)).thenReturn(existingArticle);

        service.delete(10L);

        verify(articleMapper).deleteById(10L);
    }

    @Test
    void publish_success() {
        when(articleMapper.selectById(10L)).thenReturn(existingArticle);
        when(articleMapper.updateById(any(PortalArticle.class))).thenReturn(1);

        service.publish(10L);

        assertThat(existingArticle.getIsPublished()).isEqualTo(1);
        assertThat(existingArticle.getPublishedAt()).isNotNull();
    }

    @Test
    void unpublish_success() {
        existingArticle.setIsPublished(1);
        when(articleMapper.selectById(10L)).thenReturn(existingArticle);
        when(articleMapper.updateById(any(PortalArticle.class))).thenReturn(1);

        service.unpublish(10L);

        assertThat(existingArticle.getIsPublished()).isEqualTo(0);
    }

    @Test
    void getById_notFound_throwsBizException() {
        when(articleMapper.selectById(999L)).thenReturn(null);

        assertThatThrownBy(() -> service.getById(999L))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("文章不存在");
    }

    @Test
    void getById_success_incrementsViewCount() {
        when(articleMapper.selectById(10L)).thenReturn(existingArticle);

        service.getById(10L);

        verify(viewCountHelper).increment(10L);
    }

    private CreateArticleRequest buildRequest(PublishMode mode, LocalDateTime scheduledAt) {
        CreateArticleRequest req = new CreateArticleRequest();
        req.setCategoryId(1L);
        req.setTitle("标题");
        req.setContent("<p>正文</p>");
        req.setPublishMode(mode);
        req.setScheduledAt(scheduledAt);
        return req;
    }
}
