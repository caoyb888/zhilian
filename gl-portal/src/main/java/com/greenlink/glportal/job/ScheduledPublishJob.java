package com.greenlink.glportal.job;

import com.greenlink.glportal.repository.PortalArticleMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduledPublishJob {

    private final PortalArticleMapper articleMapper;

    @Scheduled(fixedDelay = 60_000)
    public void publishScheduled() {
        int count = articleMapper.publishScheduled();
        if (count > 0) {
            log.info("定时发布 Job：本次发布 {} 篇文章", count);
        }
    }
}
