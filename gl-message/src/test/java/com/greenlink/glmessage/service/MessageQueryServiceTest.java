package com.greenlink.glmessage.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmessage.domain.MessageNotification;
import com.greenlink.glmessage.dto.response.MessageVO;
import com.greenlink.glmessage.dto.response.UnreadCountVO;
import com.greenlink.glmessage.repository.MessageNotificationMapper;
import com.greenlink.glmessage.service.impl.MessageQueryServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * S6-04 单元测试：消息列表 / 未读数 / 标记已读
 */
@ExtendWith(MockitoExtension.class)
class MessageQueryServiceTest {

    @Mock
    private MessageNotificationMapper notificationMapper;

    @InjectMocks
    private MessageQueryServiceImpl service;

    private static final Long ACCOUNT_ID = 10L;
    private static final Long OTHER_ACCOUNT = 99L;
    private static final Long MSG_ID = 1001L;

    // ─── pageList ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("消息列表：分页返回记录，isRead 字段正确映射")
    void pageList_returnsRecords() {
        MessageNotification n = buildMsg(MSG_ID, ACCOUNT_ID, "MATCH", 0);

        IPage<MessageNotification> fakePage = new Page<>(1, 20);
        fakePage.setRecords(List.of(n));
        fakePage.setTotal(1);

        when(notificationMapper.selectPage(any(IPage.class), any(QueryWrapper.class)))
                .thenReturn(fakePage);

        PageResult<MessageVO> result = service.pageList(ACCOUNT_ID, null, null, null, 1, 20);

        assertThat(result.getTotal()).isEqualTo(1);
        assertThat(result.getRecords()).hasSize(1);

        MessageVO vo = result.getRecords().get(0);
        assertThat(vo.getId()).isEqualTo(MSG_ID);
        assertThat(vo.getBizType()).isEqualTo("MATCH");
        assertThat(vo.getIsRead()).isFalse();
    }

    @Test
    @DisplayName("消息列表：已读消息 isRead 映射为 true")
    void pageList_readMessage_isReadTrue() {
        MessageNotification n = buildMsg(MSG_ID, ACCOUNT_ID, "MATCH", 1);

        IPage<MessageNotification> fakePage = new Page<>(1, 20);
        fakePage.setRecords(List.of(n));
        fakePage.setTotal(1);

        when(notificationMapper.selectPage(any(IPage.class), any(QueryWrapper.class)))
                .thenReturn(fakePage);

        PageResult<MessageVO> result = service.pageList(ACCOUNT_ID, null, null, null, 1, 20);

        assertThat(result.getRecords().get(0).getIsRead()).isTrue();
    }

    // ─── unreadCount ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("未读数：各业务类型分别统计并汇总 total")
    void unreadCount_sumsCorrectly() {
        when(notificationMapper.selectCount(any(QueryWrapper.class)))
                .thenReturn(3L)   // MATCH
                .thenReturn(2L)   // AUDIT
                .thenReturn(1L)   // ACTIVITY
                .thenReturn(0L);  // SYSTEM

        UnreadCountVO vo = service.unreadCount(ACCOUNT_ID);

        assertThat(vo.getMatch()).isEqualTo(3);
        assertThat(vo.getAudit()).isEqualTo(2);
        assertThat(vo.getActivity()).isEqualTo(1);
        assertThat(vo.getSystem()).isEqualTo(0);
        assertThat(vo.getTotal()).isEqualTo(6);
    }

    @Test
    @DisplayName("未读数：全部已读时 total 为 0")
    void unreadCount_allRead_returnsZero() {
        when(notificationMapper.selectCount(any(QueryWrapper.class))).thenReturn(0L);

        UnreadCountVO vo = service.unreadCount(ACCOUNT_ID);

        assertThat(vo.getTotal()).isEqualTo(0);
    }

    // ─── markRead ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("标记已读：正常场景，调用 update")
    void markRead_success() {
        when(notificationMapper.selectById(MSG_ID))
                .thenReturn(buildMsg(MSG_ID, ACCOUNT_ID, "MATCH", 0));
        when(notificationMapper.update(eq(null), any(UpdateWrapper.class))).thenReturn(1);

        service.markRead(ACCOUNT_ID, MSG_ID);

        verify(notificationMapper).update(eq(null), any(UpdateWrapper.class));
    }

    @Test
    @DisplayName("标记已读：消息已读则跳过，不调用 update")
    void markRead_alreadyRead_skips() {
        when(notificationMapper.selectById(MSG_ID))
                .thenReturn(buildMsg(MSG_ID, ACCOUNT_ID, "MATCH", 1));

        service.markRead(ACCOUNT_ID, MSG_ID);

        verify(notificationMapper, never()).update(any(), any(UpdateWrapper.class));
    }

    @Test
    @DisplayName("标记已读：消息不存在 → code:1003")
    void markRead_notFound_throws1003() {
        when(notificationMapper.selectById(MSG_ID)).thenReturn(null);

        assertThatThrownBy(() -> service.markRead(ACCOUNT_ID, MSG_ID))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode()).isEqualTo(1003));

        verify(notificationMapper, never()).update(any(), any(UpdateWrapper.class));
    }

    @Test
    @DisplayName("标记已读：越权（消息归属另一账号）→ code:1003")
    void markRead_notOwner_throws1003() {
        when(notificationMapper.selectById(MSG_ID))
                .thenReturn(buildMsg(MSG_ID, OTHER_ACCOUNT, "MATCH", 0));

        assertThatThrownBy(() -> service.markRead(ACCOUNT_ID, MSG_ID))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode()).isEqualTo(1003));

        verify(notificationMapper, never()).update(any(), any(UpdateWrapper.class));
    }

    // ─── markAllRead ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("全部标记已读：不传 bizType，调用 update 一次")
    void markAllRead_noFilter_callsUpdate() {
        when(notificationMapper.update(eq(null), any(UpdateWrapper.class))).thenReturn(5);

        service.markAllRead(ACCOUNT_ID, null);

        verify(notificationMapper).update(eq(null), any(UpdateWrapper.class));
    }

    @Test
    @DisplayName("全部标记已读：传 bizType=MATCH，update 仅处理 MATCH 类型")
    void markAllRead_withBizType_callsUpdate() {
        when(notificationMapper.update(eq(null), any(UpdateWrapper.class))).thenReturn(3);

        service.markAllRead(ACCOUNT_ID, "MATCH");

        verify(notificationMapper).update(eq(null), any(UpdateWrapper.class));
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private MessageNotification buildMsg(Long id, Long accountId, String bizType, int isRead) {
        MessageNotification n = new MessageNotification();
        n.setId(id);
        n.setAccountId(accountId);
        n.setBizType(bizType);
        n.setBizId(5001L);
        n.setTitle("测试通知");
        n.setContent("内容");
        n.setChannel("SITE");
        n.setIsRead(isRead);
        n.setCreatedAt(LocalDateTime.now());
        return n;
    }
}
