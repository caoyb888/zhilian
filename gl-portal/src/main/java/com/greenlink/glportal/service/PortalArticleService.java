package com.greenlink.glportal.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.glportal.dto.request.ArticlePageRequest;
import com.greenlink.glportal.dto.request.CreateArticleRequest;
import com.greenlink.glportal.dto.request.UpdateArticleRequest;
import com.greenlink.glportal.dto.response.ArticleDetailVO;
import com.greenlink.glportal.dto.response.ArticleVO;

public interface PortalArticleService {

    Page<ArticleVO> pageList(ArticlePageRequest request);

    ArticleDetailVO getById(Long id);

    ArticleDetailVO create(CreateArticleRequest request, Long publisherId);

    ArticleDetailVO update(Long id, UpdateArticleRequest request);

    void delete(Long id);

    void publish(Long id);

    void unpublish(Long id);
}
