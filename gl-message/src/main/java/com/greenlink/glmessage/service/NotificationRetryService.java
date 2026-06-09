package com.greenlink.glmessage.service;

/**
 * 消息推送失败重试服务（S6-05）。
 *
 * <p>最多重试 3 次，间隔依次为 1min / 5min / 30min（RocketMQ 延迟级别 5/9/16）。
 */
public interface NotificationRetryService {

    /**
     * 记录本次推送失败并按指数退避策略安排下一次重试。
     * 若已达最大重试次数，则仅更新数据库状态，不再投递消息。
     *
     * @param notificationId 失败的通知 ID
     * @param failReason     失败原因（用于 fail_reason 字段记录）
     */
    void handleSendFailure(Long notificationId, String failReason);
}
