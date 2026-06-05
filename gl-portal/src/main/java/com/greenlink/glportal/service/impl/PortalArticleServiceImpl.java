package com.greenlink.glportal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glportal.domain.PortalArticle;
import com.greenlink.glportal.domain.PortalCategory;
import com.greenlink.glportal.dto.request.ArticlePageRequest;
import com.greenlink.glportal.dto.request.CreateArticleRequest;
import com.greenlink.glportal.dto.request.UpdateArticleRequest;
import com.greenlink.glportal.dto.response.ArticleDetailVO;
import com.greenlink.glportal.dto.response.ArticleVO;
import com.greenlink.glportal.enums.PublishMode;
import com.greenlink.glportal.helper.ViewCountHelper;
import com.greenlink.glportal.repository.PortalArticleMapper;
import com.greenlink.glportal.repository.PortalCategoryMapper;
import com.greenlink.glportal.service.PortalArticleService;
import com.greenlink.glportal.util.HtmlSanitizerUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortalArticleServiceImpl implements PortalArticleService {

    private final PortalArticleMapper articleMapper;
    private final PortalCategoryMapper categoryMapper;
    private final ViewCountHelper viewCountHelper;

    @Override
    public Page<ArticleVO> pageList(ArticlePageRequest request) {
        LambdaQueryWrapper<PortalArticle> wrapper = new LambdaQueryWrapper<PortalArticle>()
                .eq(request.getCategoryId() != null, PortalArticle::getCategoryId, request.getCategoryId())
                .eq(request.getIsTop() != null, PortalArticle::getIsTop, Boolean.TRUE.equals(request.getIsTop()) ? 1 : 0)
                .eq(request.getPublished() != null, PortalArticle::getIsPublished, Boolean.TRUE.equals(request.getPublished()) ? 1 : 0)
                .and(StringUtils.hasText(request.getKeyword()), q -> q
                        .like(PortalArticle::getTitle, request.getKeyword())
                        .or().like(PortalArticle::getSummary, request.getKeyword()))
                .orderByDesc(PortalArticle::getIsTop)
                .orderByDesc(PortalArticle::getPublishedAt);

        Page<PortalArticle> dbPage = articleMapper.selectPage(
                new Page<>(request.getPage(), request.getSize()), wrapper);

        List<Long> catIds = dbPage.getRecords().stream()
                .map(PortalArticle::getCategoryId).distinct().toList();
        Map<Long, String> catNames = catIds.isEmpty() ? Map.of() :
                categoryMapper.selectList(
                        new LambdaQueryWrapper<PortalCategory>()
                                .select(PortalCategory::getId, PortalCategory::getName)
                                .in(PortalCategory::getId, catIds))
                        .stream()
                        .collect(Collectors.toMap(PortalCategory::getId, PortalCategory::getName));

        Page<ArticleVO> voPage = new Page<>(dbPage.getCurrent(), dbPage.getSize(), dbPage.getTotal());
        voPage.setRecords(dbPage.getRecords().stream()
                .map(a -> toVO(a, catNames.get(a.getCategoryId())))
                .toList());
        return voPage;
    }

    @Override
    public ArticleDetailVO getById(Long id) {
        PortalArticle article = articleMapper.selectById(id);
        if (article == null) {
            throw new BizException(ResultCode.ARTICLE_NOT_FOUND);
        }
        viewCountHelper.increment(id);
        return toDetailVO(article);
    }

    @Override
    @Transactional
    public ArticleDetailVO create(CreateArticleRequest request, Long publisherId) {
        if (categoryMapper.selectById(request.getCategoryId()) == null) {
            throw new BizException(ResultCode.CATEGORY_NOT_FOUND, "指定栏目不存在");
        }
        if (request.getPublishMode() == PublishMode.SCHEDULED && request.getScheduledAt() == null) {
            throw new BizException(ResultCode.PARAM_ERROR, "定时发布须指定 scheduledAt");
        }

        PortalArticle article = new PortalArticle();
        article.setCategoryId(request.getCategoryId());
        article.setTitle(request.getTitle());
        article.setContent(HtmlSanitizerUtil.sanitize(request.getContent()));
        article.setSummary(request.getSummary());
        article.setCoverUrl(request.getCoverUrl());
        article.setAuthor(request.getAuthor());
        article.setSourceUrl(request.getSourceUrl());
        article.setIsTop(request.getIsTop() != null && request.getIsTop() ? 1 : 0);
        article.setViewCount(0);
        article.setPublisherId(publisherId);

        switch (request.getPublishMode()) {
            case DRAFT -> {
                article.setIsPublished(0);
                article.setPublishedAt(null);
            }
            case NOW -> {
                article.setIsPublished(1);
                article.setPublishedAt(LocalDateTime.now());
            }
            case SCHEDULED -> {
                article.setIsPublished(0);
                article.setPublishedAt(request.getScheduledAt());
            }
        }

        articleMapper.insert(article);
        log.info("创建文章 id={} mode={}", article.getId(), request.getPublishMode());
        return toDetailVO(article);
    }

    @Override
    @Transactional
    public ArticleDetailVO update(Long id, UpdateArticleRequest request) {
        PortalArticle article = articleMapper.selectById(id);
        if (article == null) {
            throw new BizException(ResultCode.ARTICLE_NOT_FOUND);
        }
        if (request.getCategoryId() != null) {
            if (categoryMapper.selectById(request.getCategoryId()) == null) {
                throw new BizException(ResultCode.CATEGORY_NOT_FOUND, "指定栏目不存在");
            }
            article.setCategoryId(request.getCategoryId());
        }
        if (request.getTitle() != null) article.setTitle(request.getTitle());
        if (request.getContent() != null) article.setContent(HtmlSanitizerUtil.sanitize(request.getContent()));
        if (request.getSummary() != null) article.setSummary(request.getSummary());
        if (request.getCoverUrl() != null) article.setCoverUrl(request.getCoverUrl());
        if (request.getAuthor() != null) article.setAuthor(request.getAuthor());
        if (request.getSourceUrl() != null) article.setSourceUrl(request.getSourceUrl());
        if (request.getIsTop() != null) article.setIsTop(request.getIsTop() ? 1 : 0);
        articleMapper.updateById(article);
        log.info("更新文章 id={}", id);
        return toDetailVO(article);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        PortalArticle article = articleMapper.selectById(id);
        if (article == null) {
            throw new BizException(ResultCode.ARTICLE_NOT_FOUND);
        }
        articleMapper.deleteById(id);
        log.info("删除文章 id={}", id);
    }

    @Override
    @Transactional
    public void publish(Long id) {
        PortalArticle article = articleMapper.selectById(id);
        if (article == null) {
            throw new BizException(ResultCode.ARTICLE_NOT_FOUND);
        }
        article.setIsPublished(1);
        if (article.getPublishedAt() == null) {
            article.setPublishedAt(LocalDateTime.now());
        }
        articleMapper.updateById(article);
        log.info("发布文章 id={}", id);
    }

    @Override
    @Transactional
    public void unpublish(Long id) {
        PortalArticle article = articleMapper.selectById(id);
        if (article == null) {
            throw new BizException(ResultCode.ARTICLE_NOT_FOUND);
        }
        article.setIsPublished(0);
        articleMapper.updateById(article);
        log.info("下架文章 id={}", id);
    }

    private ArticleVO toVO(PortalArticle a, String categoryName) {
        ArticleVO vo = new ArticleVO();
        vo.setId(a.getId());
        vo.setCategoryId(a.getCategoryId());
        vo.setCategoryName(categoryName);
        vo.setTitle(a.getTitle());
        vo.setSummary(a.getSummary());
        vo.setCoverUrl(a.getCoverUrl());
        vo.setAuthor(a.getAuthor());
        vo.setViewCount(a.getViewCount());
        vo.setIsTop(a.getIsTop() == 1);
        vo.setIsPublished(a.getIsPublished() == 1);
        vo.setPublishedAt(a.getPublishedAt());
        vo.setCreatedAt(a.getCreatedAt());
        return vo;
    }

    private ArticleDetailVO toDetailVO(PortalArticle a) {
        ArticleDetailVO vo = new ArticleDetailVO();
        vo.setId(a.getId());
        vo.setCategoryId(a.getCategoryId());
        vo.setTitle(a.getTitle());
        vo.setSummary(a.getSummary());
        vo.setCoverUrl(a.getCoverUrl());
        vo.setAuthor(a.getAuthor());
        vo.setViewCount(a.getViewCount() == null ? 0 : a.getViewCount());
        vo.setIsTop(a.getIsTop() == 1);
        vo.setIsPublished(a.getIsPublished() == 1);
        vo.setPublishedAt(a.getPublishedAt());
        vo.setCreatedAt(a.getCreatedAt());
        vo.setContent(a.getContent());
        vo.setSourceUrl(a.getSourceUrl());
        return vo;
    }
}
