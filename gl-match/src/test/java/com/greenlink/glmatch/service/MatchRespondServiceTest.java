package com.greenlink.glmatch.service;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.glmatch.domain.MatchRecord;
import com.greenlink.glmatch.dto.request.MatchRespondRequest;
import com.greenlink.glmatch.dto.response.MatchRespondVO;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import com.greenlink.glmatch.service.impl.MatchRespondServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * S5-06 单元测试：响应对接申请（6 个核心场景）
 */
@ExtendWith(MockitoExtension.class)
class MatchRespondServiceTest {

    @Mock
    private MatchRecordMapper matchRecordMapper;

    @InjectMocks
    private MatchRespondServiceImpl service;

    private static final Long RECORD_ID      = 1L;
    private static final Long INITIATOR_ACC  = 10L;  // 发起方 accountId
    private static final Long RESPONDER_ACC  = 20L;  // 被申请方 accountId
    private static final Long RESOURCE_MBR   = 1L;   // 资源方 memberId
    private static final Long DEMAND_MBR     = 2L;   // 需求方 memberId

    private MatchRecord pendingRecord;

    @BeforeEach
    void setUp() {
        pendingRecord = new MatchRecord();
        pendingRecord.setId(RECORD_ID);
        pendingRecord.setResourceId(100L);
        pendingRecord.setDemandId(200L);
        pendingRecord.setResourceMemberId(RESOURCE_MBR);
        pendingRecord.setDemandMemberId(DEMAND_MBR);
        pendingRecord.setInitiatorId(INITIATOR_ACC);
        pendingRecord.setStatus(1);  // 待响应
    }

    @Test
    @DisplayName("场景1：被申请方接受 → status 变为 2")
    void respond_accept_success() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(pendingRecord);
        when(matchRecordMapper.update(eq(null), any(UpdateWrapper.class))).thenReturn(1);

        MatchRespondRequest req = new MatchRespondRequest();
        req.setAction("ACCEPT");

        // 需求方（非发起方）来响应
        MatchRespondVO vo = service.respond(RECORD_ID, RESPONDER_ACC, DEMAND_MBR, req);

        assertThat(vo.getStatus()).isEqualTo(2);
        assertThat(vo.getRecordId()).isEqualTo(RECORD_ID);
    }

    @Test
    @DisplayName("场景2：被申请方拒绝 → status 变为 6")
    void respond_reject_success() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(pendingRecord);
        when(matchRecordMapper.update(eq(null), any(UpdateWrapper.class))).thenReturn(1);

        MatchRespondRequest req = new MatchRespondRequest();
        req.setAction("REJECT");

        MatchRespondVO vo = service.respond(RECORD_ID, RESPONDER_ACC, DEMAND_MBR, req);

        assertThat(vo.getStatus()).isEqualTo(6);
    }

    @Test
    @DisplayName("场景3：发起方试图响应 → code:1003")
    void respond_initiatorCannotRespond_throws1003() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(pendingRecord);

        MatchRespondRequest req = new MatchRespondRequest();
        req.setAction("ACCEPT");

        assertThatThrownBy(() -> service.respond(RECORD_ID, INITIATOR_ACC, RESOURCE_MBR, req))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode()).isEqualTo(1003));

        verify(matchRecordMapper, never()).update(any(), any(UpdateWrapper.class));
    }

    @Test
    @DisplayName("场景4：非双方成员响应 → code:1003")
    void respond_notParty_throws1003() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(pendingRecord);

        MatchRespondRequest req = new MatchRespondRequest();
        req.setAction("ACCEPT");

        Long outsiderMember = 99L;
        assertThatThrownBy(() -> service.respond(RECORD_ID, RESPONDER_ACC, outsiderMember, req))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode()).isEqualTo(1003));

        verify(matchRecordMapper, never()).update(any(), any(UpdateWrapper.class));
    }

    @Test
    @DisplayName("场景5：记录状态非1（已接受）→ 非法流转 code:3103")
    void respond_illegalTransition_throws3103() {
        pendingRecord.setStatus(2);  // 已接受，不能再响应
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(pendingRecord);

        MatchRespondRequest req = new MatchRespondRequest();
        req.setAction("ACCEPT");

        assertThatThrownBy(() -> service.respond(RECORD_ID, RESPONDER_ACC, DEMAND_MBR, req))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode()).isEqualTo(3103));

        verify(matchRecordMapper, never()).update(any(), any(UpdateWrapper.class));
    }

    @Test
    @DisplayName("场景6：记录不存在 → code:3001")
    void respond_recordNotFound_throws3001() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(null);

        MatchRespondRequest req = new MatchRespondRequest();
        req.setAction("ACCEPT");

        assertThatThrownBy(() -> service.respond(RECORD_ID, RESPONDER_ACC, DEMAND_MBR, req))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode()).isEqualTo(3001));

        verify(matchRecordMapper, never()).update(any(), any(UpdateWrapper.class));
    }
}
