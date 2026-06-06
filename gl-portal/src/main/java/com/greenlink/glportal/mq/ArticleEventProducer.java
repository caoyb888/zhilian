package com.greenlink.glportal.mq;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ArticleEventProducer {

    static final String TOPIC = "PORTAL_ARTICLE_EVENT";

    private final RocketMQTemplate rocketMQTemplate;

    public void sendSave(Long articleId) {
        send(new ArticleEventMessage(ArticleEventMessage.EVENT_SAVE, articleId));
    }

    public void sendDelete(Long articleId) {
        send(new ArticleEventMessage(ArticleEventMessage.EVENT_DELETE, articleId));
    }

    private void send(ArticleEventMessage message) {
        try {
            rocketMQTemplate.convertAndSend(TOPIC, message);
            log.debug("发送文章事件 type={} id={}", message.getEventType(), message.getArticleId());
        } catch (Exception e) {
            log.warn("文章事件发送失败 type={} id={}", message.getEventType(), message.getArticleId(), e);
        }
    }
}
