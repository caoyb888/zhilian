package com.greenlink.glmessage.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.greenlink.glmessage.domain.MessageNotification;
import com.greenlink.glmessage.mq.NotificationRetryProducer;
import com.greenlink.glmessage.repository.MessageNotificationMapper;
import com.greenlink.glmessage.service.NotificationRetryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationRetryServiceImpl implements NotificationRetryService {

    /** 最大重试次数。*/
    static final int MAX_RETRIES = 3;

    /**
     * 按重试次数（1/2/3）对应的 RocketMQ 延迟级别。
     * index 0 不使用；1=1min(level5)、2=5min(level9)、3=30min(level16)。
     */
    static final int[] DELAY_LEVELS = {0, 5, 9, 16};

    private final MessageNotificationMapper notificationMapper;
    private final NotificationRetryProducer retryProducer;

    @Override
    public void handleSendFailure(Long notificationId, String failReason) {
        MessageNotification n = notificationMapper.selectById(notificationId);
        if (n == null) {
            log.warn("重试通知不存在 notificationId={}", notificationId);
            return;
        }

        int newRetryCount = (n.getRetryCount() == null ? 0 : n.getRetryCount()) + 1;

        UpdateWrapper<MessageNotification> wrapper = new UpdateWrapper<>();
        wrapper.eq("id", notificationId)
               .set("send_status", 2)
               .set("fail_reason", failReason)
               .set("retry_count", newRetryCount);
        notificationMapper.update(null, wrapper);

        if (newRetryCount <= MAX_RETRIES) {
            int delayLevel = DELAY_LEVELS[newRetryCount];
            retryProducer.sendDelayed(notificationId, delayLevel);
            log.info("消息推送失败，已安排第{}次重试 notificationId={} delayLevel={}",
                    newRetryCount, notificationId, delayLevel);
        } else {
            log.error("消息推送已达最大重试次数({})，放弃重试 notificationId={} failReason={}",
                    MAX_RETRIES, notificationId, failReason);
        }
    }
}
