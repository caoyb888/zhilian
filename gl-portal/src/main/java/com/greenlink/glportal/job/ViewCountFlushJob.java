package com.greenlink.glportal.job;

import com.greenlink.glportal.helper.ViewCountHelper;
import com.greenlink.glportal.repository.PortalArticleMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ViewCountFlushJob {

    private final StringRedisTemplate redisTemplate;
    private final ViewCountHelper viewCountHelper;
    private final PortalArticleMapper articleMapper;

    @Scheduled(fixedDelay = 600_000)
    public void flush() {
        int flushed = 0;
        ScanOptions opts = ScanOptions.scanOptions()
                .match(ViewCountHelper.KEY_PREFIX + "*")
                .count(200)
                .build();
        try (Cursor<String> cursor = redisTemplate.scan(opts)) {
            while (cursor.hasNext()) {
                String key = cursor.next();
                Long articleId = Long.parseLong(key.substring(ViewCountHelper.KEY_PREFIX.length()));
                Long delta = viewCountHelper.getAndDelete(articleId);
                if (delta == null || delta <= 0) continue;
                articleMapper.addViewCount(articleId, delta);
                flushed++;
            }
        }
        if (flushed > 0) {
            log.info("浏览量回写 Job：本次更新 {} 篇文章", flushed);
        }
    }
}
