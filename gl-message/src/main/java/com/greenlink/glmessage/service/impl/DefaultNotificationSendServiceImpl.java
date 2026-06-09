package com.greenlink.glmessage.service.impl;

import com.greenlink.glmessage.domain.MessageNotification;
import com.greenlink.glmessage.service.NotificationSendService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 默认推送实现。SITE 频道无需额外操作（记录已写库即视为投递）。
 * S6-03 将提供 @Primary WechatNotificationSendService 处理 WECHAT 频道。
 */
@Slf4j
@Service
public class DefaultNotificationSendServiceImpl implements NotificationSendService {

    @Override
    public void send(MessageNotification notification) {
        log.debug("SITE 频道无需额外推送 notificationId={}", notification.getId());
    }
}
