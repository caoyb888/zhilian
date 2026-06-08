package com.greenlink.glmessage.mq;

import com.greenlink.common.mq.MatchEventMessage;
import com.greenlink.glmessage.service.SiteNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@RocketMQMessageListener(
        topic = MatchEventMessage.TOPIC,
        consumerGroup = "gl-message-consumer"
)
public class MatchEventConsumer implements RocketMQListener<MatchEventMessage> {

    private final SiteNotificationService siteNotificationService;

    @Override
    public void onMessage(MatchEventMessage event) {
        log.info("收到对接事件 eventType={} matchId={}", event.getEventType(), event.getMatchId());
        try {
            siteNotificationService.createFromMatchEvent(event);
        } catch (Exception e) {
            log.error("处理对接事件失败 eventType={} matchId={}", event.getEventType(), event.getMatchId(), e);
            throw e; // 抛出使 RocketMQ 触发重试
        }
    }
}
