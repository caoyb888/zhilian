package com.greenlink.glmessage.mq;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationRetryProducer {

    private final RocketMQTemplate rocketMQTemplate;

    /**
     * 发送延迟重试消息。
     *
     * <p>RocketMQ 内置延迟级别（1s/5s/10s/30s/1m/2m/3m/4m/5m … 30m/1h/2h），
     * level 5=1min、level 9=5min、level 16=30min。
     */
    public void sendDelayed(Long notificationId, int delayLevel) {
        NotificationRetryMessage msg = new NotificationRetryMessage();
        msg.setNotificationId(notificationId);
        rocketMQTemplate.syncSend(
                NotificationRetryMessage.TOPIC,
                MessageBuilder.withPayload(msg).build(),
                3000,
                delayLevel);
        log.info("已投递延迟重试消息 notificationId={} delayLevel={}", notificationId, delayLevel);
    }
}
