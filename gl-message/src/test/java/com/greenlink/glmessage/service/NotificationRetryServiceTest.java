package com.greenlink.glmessage.service;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.greenlink.glmessage.domain.MessageNotification;
import com.greenlink.glmessage.mq.NotificationRetryProducer;
import com.greenlink.glmessage.repository.MessageNotificationMapper;
import com.greenlink.glmessage.service.impl.NotificationRetryServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * S6-05 单元测试：消息推送失败重试服务
 */
@ExtendWith(MockitoExtension.class)
class NotificationRetryServiceTest {

    @Mock
    private MessageNotificationMapper notificationMapper;

    @Mock
    private NotificationRetryProducer retryProducer;

    @InjectMocks
    private NotificationRetryServiceImpl service;

    private static final Long NOTIFICATION_ID = 1001L;
    private static final String FAIL_REASON   = "连接超时";

    // ─── 重试调度（延迟级别）─────────────────────────────────────────────────

    @Test
    @DisplayName("第1次失败(retry_count=0) → delay level 5(1min)")
    void handleSendFailure_firstFailure_schedulesLevel5() {
        when(notificationMapper.selectById(NOTIFICATION_ID)).thenReturn(buildNotification(0));

        service.handleSendFailure(NOTIFICATION_ID, FAIL_REASON);

        ArgumentCaptor<Integer> levelCaptor = ArgumentCaptor.forClass(Integer.class);
        verify(retryProducer).sendDelayed(eq(NOTIFICATION_ID), levelCaptor.capture());
        assertThat(levelCaptor.getValue()).isEqualTo(5); // RocketMQ level 5 = 1min
    }

    @Test
    @DisplayName("第2次失败(retry_count=1) → delay level 9(5min)")
    void handleSendFailure_secondFailure_schedulesLevel9() {
        when(notificationMapper.selectById(NOTIFICATION_ID)).thenReturn(buildNotification(1));

        service.handleSendFailure(NOTIFICATION_ID, FAIL_REASON);

        ArgumentCaptor<Integer> levelCaptor = ArgumentCaptor.forClass(Integer.class);
        verify(retryProducer).sendDelayed(eq(NOTIFICATION_ID), levelCaptor.capture());
        assertThat(levelCaptor.getValue()).isEqualTo(9); // RocketMQ level 9 = 5min
    }

    @Test
    @DisplayName("第3次失败(retry_count=2) → delay level 16(30min)")
    void handleSendFailure_thirdFailure_schedulesLevel16() {
        when(notificationMapper.selectById(NOTIFICATION_ID)).thenReturn(buildNotification(2));

        service.handleSendFailure(NOTIFICATION_ID, FAIL_REASON);

        ArgumentCaptor<Integer> levelCaptor = ArgumentCaptor.forClass(Integer.class);
        verify(retryProducer).sendDelayed(eq(NOTIFICATION_ID), levelCaptor.capture());
        assertThat(levelCaptor.getValue()).isEqualTo(16); // RocketMQ level 16 = 30min
    }

    @Test
    @DisplayName("已达最大重试次数(retry_count=3) → 不再投递延迟消息，仅更新DB")
    void handleSendFailure_maxRetriesReached_noMoreScheduling() {
        when(notificationMapper.selectById(NOTIFICATION_ID)).thenReturn(buildNotification(3));

        service.handleSendFailure(NOTIFICATION_ID, FAIL_REASON);

        verify(retryProducer, never()).sendDelayed(anyLong(), anyInt());
        verify(notificationMapper).update(eq(null), ArgumentCaptor.forClass(UpdateWrapper.class).capture());
    }

    @Test
    @DisplayName("retry_count 为 null 时视为 0，正常触发第1次重试")
    void handleSendFailure_nullRetryCount_treatedAsZero() {
        MessageNotification n = buildNotification(0);
        n.setRetryCount(null);
        when(notificationMapper.selectById(NOTIFICATION_ID)).thenReturn(n);

        service.handleSendFailure(NOTIFICATION_ID, FAIL_REASON);

        ArgumentCaptor<Integer> levelCaptor = ArgumentCaptor.forClass(Integer.class);
        verify(retryProducer).sendDelayed(eq(NOTIFICATION_ID), levelCaptor.capture());
        assertThat(levelCaptor.getValue()).isEqualTo(5);
    }

    // ─── DB 更新正确性 ────────────────────────────────────────────────────────

    @Test
    @DisplayName("retry_count 在 DB 中递增为 newCount")
    void handleSendFailure_dbRetryCountIncremented() {
        when(notificationMapper.selectById(NOTIFICATION_ID)).thenReturn(buildNotification(1));

        service.handleSendFailure(NOTIFICATION_ID, FAIL_REASON);

        ArgumentCaptor<UpdateWrapper<MessageNotification>> captor = ArgumentCaptor.forClass(UpdateWrapper.class);
        verify(notificationMapper).update(eq(null), captor.capture());
        // paramNameValuePairs 存储了 set() 写入的实际值
        assertThat(captor.getValue().getParamNameValuePairs()).containsValue(2); // retry_count=2
    }

    @Test
    @DisplayName("fail_reason 正确写入 DB")
    void handleSendFailure_failReasonPersistedInDb() {
        when(notificationMapper.selectById(NOTIFICATION_ID)).thenReturn(buildNotification(0));

        String reason = "WeChat API 503";
        service.handleSendFailure(NOTIFICATION_ID, reason);

        ArgumentCaptor<UpdateWrapper<MessageNotification>> captor = ArgumentCaptor.forClass(UpdateWrapper.class);
        verify(notificationMapper).update(eq(null), captor.capture());
        assertThat(captor.getValue().getParamNameValuePairs()).containsValue(reason);
    }

    // ─── 边界 / 防御 ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("通知不存在时安全退出，不抛异常、不更新DB")
    void handleSendFailure_notificationNotFound_noException() {
        when(notificationMapper.selectById(NOTIFICATION_ID)).thenReturn(null);

        service.handleSendFailure(NOTIFICATION_ID, FAIL_REASON);

        verify(retryProducer, never()).sendDelayed(anyLong(), anyInt());
        verify(notificationMapper, never()).update(eq(null), ArgumentCaptor.forClass(UpdateWrapper.class).capture());
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private MessageNotification buildNotification(int retryCount) {
        MessageNotification n = new MessageNotification();
        n.setId(NOTIFICATION_ID);
        n.setAccountId(10L);
        n.setChannel("WECHAT");
        n.setSendStatus(2);
        n.setRetryCount(retryCount);
        return n;
    }
}
