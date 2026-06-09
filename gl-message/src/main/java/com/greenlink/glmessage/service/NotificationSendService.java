package com.greenlink.glmessage.service;

import com.greenlink.glmessage.domain.MessageNotification;

/**
 * 消息推送执行层。
 *
 * <p>SITE 频道已由 {@link SiteNotificationService} 直接写库完成，默认实现为空操作。
 * S6-03 微信推送将提供 WECHAT 频道的具体实现（@Primary 覆盖）。
 */
public interface NotificationSendService {

    /**
     * 执行推送。推送失败时抛出异常，由调用方决定是否触发重试。
     */
    void send(MessageNotification notification) throws Exception;
}
