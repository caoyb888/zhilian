package com.greenlink.glmessage.mq;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.greenlink.glmessage.domain.MessageNotification;
import com.greenlink.glmessage.repository.MessageNotificationMapper;
import com.greenlink.glmessage.service.NotificationRetryService;
import com.greenlink.glmessage.service.NotificationSendService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * S6-05 单元测试：重试消息消费者
 */
@ExtendWith(MockitoExtension.class)
class NotificationRetryConsumerTest {

    @Mock
    private MessageNotificationMapper notificationMapper;

    @Mock
    private NotificationSendService notificationSendService;

    @Mock
    private NotificationRetryService notificationRetryService;

    @InjectMocks
    private NotificationRetryConsumer consumer;

    private static final Long NOTIFICATION_ID = 2001L;

    private NotificationRetryMessage retryMsg() {
        NotificationRetryMessage m = new NotificationRetryMessage();
        m.setNotificationId(NOTIFICATION_ID);
        return m;
    }

    private MessageNotification buildNotification(int sendStatus) {
        MessageNotification n = new MessageNotification();
        n.setId(NOTIFICATION_ID);
        n.setAccountId(10L);
        n.setChannel("WECHAT");
        n.setSendStatus(sendStatus);
        n.setRetryCount(1);
        return n;
    }

    // ─── 正常路径 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("重试成功：调用 send 后更新 send_status=1")
    void onMessage_sendSuccess_marksSent() throws Exception {
        when(notificationMapper.selectById(NOTIFICATION_ID)).thenReturn(buildNotification(2));

        consumer.onMessage(retryMsg());

        verify(notificationSendService).send(any(MessageNotification.class));
        verify(notificationMapper).update(eq(null), any(UpdateWrapper.class));
        verify(notificationRetryService, never()).handleSendFailure(any(), any());
    }

    @Test
    @DisplayName("重试失败：调用 handleSendFailure，不更新 send_status=1")
    void onMessage_sendFails_callsHandleSendFailure() throws Exception {
        when(notificationMapper.selectById(NOTIFICATION_ID)).thenReturn(buildNotification(2));
        doThrow(new RuntimeException("API error")).when(notificationSendService).send(any());

        consumer.onMessage(retryMsg());

        verify(notificationRetryService).handleSendFailure(eq(NOTIFICATION_ID), any());
        // 不调用 markSent
        verify(notificationMapper, never()).update(eq(null), any(UpdateWrapper.class));
    }

    // ─── 防御场景 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("消息不存在：跳过，不调用 send")
    void onMessage_notificationNotFound_skips() throws Exception {
        when(notificationMapper.selectById(NOTIFICATION_ID)).thenReturn(null);

        consumer.onMessage(retryMsg());

        verify(notificationSendService, never()).send(any());
        verify(notificationRetryService, never()).handleSendFailure(any(), any());
    }

    @Test
    @DisplayName("消息已成功发送(send_status=1)：跳过，不重复 send")
    void onMessage_alreadySent_skips() throws Exception {
        when(notificationMapper.selectById(NOTIFICATION_ID)).thenReturn(buildNotification(1));

        consumer.onMessage(retryMsg());

        verify(notificationSendService, never()).send(any());
        verify(notificationRetryService, never()).handleSendFailure(any(), any());
    }
}
