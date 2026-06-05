package com.greenlink.glportal.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.result.Result;
import com.greenlink.glportal.dto.request.ArticlePageRequest;
import com.greenlink.glportal.dto.request.CreateArticleRequest;
import com.greenlink.glportal.dto.request.UpdateArticleRequest;
import com.greenlink.glportal.dto.response.ArticleDetailVO;
import com.greenlink.glportal.dto.response.ArticleVO;
import com.greenlink.glportal.service.PortalArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/portal/articles")
@RequiredArgsConstructor
public class PortalArticleController {

    private final PortalArticleService articleService;

    @GetMapping
    public Result<Page<ArticleVO>> pageList(@ModelAttribute ArticlePageRequest request) {
        return Result.ok(articleService.pageList(request));
    }

    @GetMapping("/{id}")
    public Result<ArticleDetailVO> getById(@PathVariable Long id) {
        return Result.ok(articleService.getById(id));
    }

    @PostMapping
    public Result<ArticleDetailVO> create(
            @Valid @RequestBody CreateArticleRequest request,
            @RequestHeader(value = "X-Account-Id", required = false) Long publisherId) {
        return Result.ok(articleService.create(request, publisherId));
    }

    @PutMapping("/{id}")
    public Result<ArticleDetailVO> update(@PathVariable Long id,
                                          @Valid @RequestBody UpdateArticleRequest request) {
        return Result.ok(articleService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        articleService.delete(id);
        return Result.ok();
    }

    @PatchMapping("/{id}/publish")
    public Result<Void> publish(@PathVariable Long id) {
        articleService.publish(id);
        return Result.ok();
    }

    @PatchMapping("/{id}/unpublish")
    public Result<Void> unpublish(@PathVariable Long id) {
        articleService.unpublish(id);
        return Result.ok();
    }
}
