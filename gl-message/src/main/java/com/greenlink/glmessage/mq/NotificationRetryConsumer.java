package com.greenlink.glmessage.mq;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.greenlink.glmessage.domain.MessageNotification;
import com.greenlink.glmessage.repository.MessageNotificationMapper;
import com.greenlink.glmessage.service.NotificationRetryService;
import com.greenlink.glmessage.service.NotificationSendService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
@RocketMQMessageListener(
        topic = NotificationRetryMessage.TOPIC,
        consumerGroup = "gl-message-retry-consumer"
)
public class NotificationRetryConsumer implements RocketMQListener<NotificationRetryMessage> {

    private final MessageNotificationMapper notificationMapper;
    private final NotificationSendService notificationSendService;
    private final NotificationRetryService notificationRetryService;

    @Override
    public void onMessage(NotificationRetryMessage retryMsg) {
        Long notificationId = retryMsg.getNotificationId();
        log.info("收到消息重试请求 notificationId={}", notificationId);

        MessageNotification notification = notificationMapper.selectById(notificationId);
        if (notification == null) {
            log.warn("重试消息不存在，跳过 notificationId={}", notificationId);
            return;
        }
        if (Integer.valueOf(1).equals(notification.getSendStatus())) {
            log.info("消息已发送成功，无需重试 notificationId={}", notificationId);
            return;
        }

        try {
            notificationSendService.send(notification);
            markSent(notificationId);
            log.info("消息重试发送成功 notificationId={}", notificationId);
        } catch (Exception e) {
            log.error("消息重试发送失败 notificationId={}", notificationId, e);
            notificationRetryService.handleSendFailure(notificationId, e.getMessage());
        }
    }

    private void markSent(Long notificationId) {
        UpdateWrapper<MessageNotification> wrapper = new UpdateWrapper<>();
        wrapper.eq("id", notificationId)
               .set("send_status", 1)
               .set("send_at", LocalDateTime.now());
        notificationMapper.update(null, wrapper);
    }
}
