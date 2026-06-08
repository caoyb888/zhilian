package com.greenlink.glmatch.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmatch.domain.MatchMessage;
import com.greenlink.glmatch.domain.MatchRecord;
import com.greenlink.glmatch.dto.request.SendMessageRequest;
import com.greenlink.glmatch.dto.response.MarkReadVO;
import com.greenlink.glmatch.dto.response.MatchMessageVO;
import com.greenlink.glmatch.repository.MatchMessageMapper;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import com.greenlink.glmatch.service.impl.MatchMessageServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * S6-01 单元测试：对接消息发送/查询/已读标记（7 个场景）
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MatchMessageServiceTest {

    @Mock private MatchRecordMapper matchRecordMapper;
    @Mock private MatchMessageMapper matchMessageMapper;

    @InjectMocks
    private MatchMessageServiceImpl service;

    private static final Long MATCH_ID     = 1L;
    private static final Long RESOURCE_MBR = 1L;
    private static final Long DEMAND_MBR   = 2L;
    private static final Long ACCOUNT_A    = 10L;  // 资源方账号
    private static final Long ACCOUNT_B    = 20L;  // 需求方账号

    private MatchRecord activeRecord;

    @BeforeEach
    void setUp() {
        activeRecord = new MatchRecord();
        activeRecord.setId(MATCH_ID);
        activeRecord.setResourceMemberId(RESOURCE_MBR);
        activeRecord.setDemandMemberId(DEMAND_MBR);
        activeRecord.setInitiatorId(ACCOUNT_A);
        activeRecord.setStatus(2); // 已接受

        when(matchRecordMapper.selectById(MATCH_ID)).thenReturn(activeRecord);
        doReturn(0).when(matchMessageMapper).markAllRead(any(), any());
    }

    // ── send ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("S6-01-01: 正常发送文本消息，返回 VO 含正确字段")
    void send_textMessage_success() {
        SendMessageRequest req = new SendMessageRequest();
        req.setMsgType(1);
        req.setContent("你好，我们可以合作！");

        MatchMessageVO vo = service.send(MATCH_ID, ACCOUNT_A, RESOURCE_MBR, req);

        assertThat(vo.getMatchId()).isEqualTo(MATCH_ID);
        assertThat(vo.getSenderId()).isEqualTo(ACCOUNT_A);
        assertThat(vo.getContent()).isEqualTo("你好，我们可以合作！");
        assertThat(vo.getMsgType()).isEqualTo(1);
        assertThat(vo.getIsRead()).isEqualTo(0);
    }

    @Test
    @DisplayName("S6-01-02: 非当事方无法发送消息，抛出 1003")
    void send_nonParty_throws1003() {
        SendMessageRequest req = new SendMessageRequest();
        req.setMsgType(1);
        req.setContent("无权发送");

        assertThatThrownBy(() -> service.send(MATCH_ID, 999L, 99L, req))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("无权");
    }

    @Test
    @DisplayName("S6-01-03: 对接已关闭（status=6）时不能发送消息，抛出 3103")
    void send_closedRecord_throws3103() {
        activeRecord.setStatus(6);

        SendMessageRequest req = new SendMessageRequest();
        req.setMsgType(1);
        req.setContent("尝试发送");

        assertThatThrownBy(() -> service.send(MATCH_ID, ACCOUNT_A, RESOURCE_MBR, req))
                .isInstanceOf(BizException.class)
                .extracting("code")
                .isEqualTo(3103);
    }

    // ── listMessages ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("S6-01-04: 正常分页查询消息，并触发已读标记")
    void listMessages_success_markReadCalled() {
        MatchMessage msg = new MatchMessage();
        msg.setId(1L);
        msg.setMatchId(MATCH_ID);
        msg.setSenderId(ACCOUNT_B);
        msg.setMsgType(1);
        msg.setContent("收到");
        msg.setIsRead(0);
        msg.setCreatedAt(LocalDateTime.now());

        Page<MatchMessage> mockPage = new Page<>(1, 20);
        mockPage.setRecords(List.of(msg));
        mockPage.setTotal(1L);
        doReturn(mockPage).when(matchMessageMapper).selectPage(any(), any());

        PageResult<MatchMessageVO> result =
                service.listMessages(MATCH_ID, ACCOUNT_A, RESOURCE_MBR, 1, 20);

        assertThat(result.getRecords()).hasSize(1);
        assertThat(result.getTotal()).isEqualTo(1L);
        assertThat(result.getRecords().get(0).getContent()).isEqualTo("收到");
        // 查询时应触发已读标记
        verify(matchMessageMapper).markAllRead(eq(MATCH_ID), eq(ACCOUNT_A));
    }

    @Test
    @DisplayName("S6-01-05: 非当事方无法查询消息，抛出 1003")
    void listMessages_nonParty_throws1003() {
        assertThatThrownBy(() ->
                service.listMessages(MATCH_ID, 999L, 99L, 1, 20))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("无权");
    }

    // ── markAllRead ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("S6-01-06: 正常标记已读，返回受影响行数")
    void markAllRead_success() {
        doReturn(3).when(matchMessageMapper).markAllRead(MATCH_ID, ACCOUNT_A);

        MarkReadVO vo = service.markAllRead(MATCH_ID, ACCOUNT_A, RESOURCE_MBR);

        assertThat(vo.getMarkedCount()).isEqualTo(3);
        verify(matchMessageMapper).markAllRead(MATCH_ID, ACCOUNT_A);
    }

    @Test
    @DisplayName("S6-01-07: 对接记录不存在时返回 3001")
    void markAllRead_notFound_throws3001() {
        when(matchRecordMapper.selectById(999L)).thenReturn(null);

        assertThatThrownBy(() ->
                service.markAllRead(999L, ACCOUNT_A, RESOURCE_MBR))
                .isInstanceOf(BizException.class)
                .extracting("code")
                .isEqualTo(3001);
    }
}
