package com.greenlink.glportal.mq;

import com.greenlink.glportal.domain.PortalArticle;
import com.greenlink.glportal.es.ArticleEsSyncService;
import com.greenlink.glportal.repository.PortalArticleMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@RocketMQMessageListener(
        topic = ArticleEventProducer.TOPIC,
        consumerGroup = "gl-portal-es-sync-group"
)
public class ArticleEventConsumer implements RocketMQListener<ArticleEventMessage> {

    private final PortalArticleMapper articleMapper;
    private final ArticleEsSyncService esSyncService;

    @Override
    public void onMessage(ArticleEventMessage message) {
        log.debug("收到文章事件 type={} id={}", message.getEventType(), message.getArticleId());
        if (ArticleEventMessage.EVENT_SAVE.equals(message.getEventType())) {
            PortalArticle article = articleMapper.selectById(message.getArticleId());
            // null: 已被软删除（全局逻辑删除过滤）或物理不存在；isDeleted 二次保险防止 MQ 乱序
            if (article != null && article.getIsDeleted() == 0) {
                esSyncService.syncSave(article);
            }
        } else if (ArticleEventMessage.EVENT_DELETE.equals(message.getEventType())) {
            esSyncService.syncDelete(message.getArticleId());
        }
    }
}
