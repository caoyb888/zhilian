package com.greenlink.glportal.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
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

    private static final int SYNC_BATCH_SIZE = 500;

    /** 历史数据全量同步（T3-03-5，管理员一次性执行）；分批处理防止 OOM */
    @PostMapping("/sync-all")
    public Result<Integer> syncAll() {
        QueryWrapper<PortalArticle> wrapper = new QueryWrapper<PortalArticle>()
                .select("id", "category_id", "title", "summary", "is_published", "is_deleted")
                .eq("is_deleted", 0);
        int pageNum = 1;
        int total = 0;
        List<PortalArticle> batch;
        do {
            batch = articleMapper.selectPage(new Page<>(pageNum++, SYNC_BATCH_SIZE, false), wrapper)
                    .getRecords();
            if (!batch.isEmpty()) {
                esSyncService.syncAll(batch);
                total += batch.size();
            }
        } while (batch.size() == SYNC_BATCH_SIZE);
        log.info("全量 ES 同步完成，共 {} 篇文章", total);
        return Result.ok(total);
    }
}
