package com.greenlink.glportal.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.greenlink.common.result.Result;
import com.greenlink.glportal.domain.PortalArticle;
import com.greenlink.glportal.es.ArticleEsSyncService;
import com.greenlink.glportal.repository.PortalArticleMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/portal/es")
@RequiredArgsConstructor
public class PortalEsSyncController {

    private final PortalArticleMapper articleMapper;
    private final ArticleEsSyncService esSyncService;

    /** 历史数据全量同步（T3-03-5，管理员一次性执行） */
    @PostMapping("/sync-all")
    public Result<Integer> syncAll() {
        List<PortalArticle> articles = articleMapper.selectList(
                new LambdaQueryWrapper<PortalArticle>()
                        .eq(PortalArticle::getIsDeleted, 0));
        esSyncService.syncAll(articles);
        log.info("触发全量 ES 同步，共 {} 篇文章", articles.size());
        return Result.ok(articles.size());
    }
}
