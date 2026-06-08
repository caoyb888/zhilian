package com.greenlink.glmatch.service;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.glmatch.domain.MatchRecord;
import com.greenlink.glmatch.dto.request.MatchStatusUpdateRequest;
import com.greenlink.glmatch.dto.response.MatchStatusUpdateVO;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import com.greenlink.glmatch.service.impl.MatchStatusUpdateServiceImpl;
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
 * S5-07 单元测试：更新对接状态（完成/撤销/进入洽谈）
 */
@ExtendWith(MockitoExtension.class)
class MatchStatusUpdateServiceTest {

    @Mock
    private MatchRecordMapper matchRecordMapper;

    @InjectMocks
    private MatchStatusUpdateServiceImpl service;

    private static final Long RECORD_ID     = 1L;
    private static final Long INITIATOR_ACC = 10L;
    private static final Long OTHER_ACC     = 20L;
    private static final Long RESOURCE_MBR  = 1L;
    private static final Long DEMAND_MBR    = 2L;

    private MatchRecord buildRecord(int status) {
        MatchRecord r = new MatchRecord();
        r.setId(RECORD_ID);
        r.setResourceId(100L);
        r.setDemandId(200L);
        r.setResourceMemberId(RESOURCE_MBR);
        r.setDemandMemberId(DEMAND_MBR);
        r.setInitiatorId(INITIATOR_ACC);
        r.setStatus(status);
        return r;
    }

    private MatchStatusUpdateRequest req(String action) {
        MatchStatusUpdateRequest r = new MatchStatusUpdateRequest();
        r.setAction(action);
        return r;
    }

    // ─── NEGOTIATE ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("NEGOTIATE：2(已接受) → 3(洽谈中) 成功")
    void negotiate_from_accepted_success() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(buildRecord(2));
        when(matchRecordMapper.update(eq(null), any(UpdateWrapper.class))).thenReturn(1);

        MatchStatusUpdateVO vo = service.update(RECORD_ID, OTHER_ACC, DEMAND_MBR, req("NEGOTIATE"));

        assertThat(vo.getStatus()).isEqualTo(3);
    }

    @Test
    @DisplayName("NEGOTIATE：非 status=2 时返回 3103")
    void negotiate_illegalSource_throws3103() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(buildRecord(3)); // 已经是洽谈中

        assertThatThrownBy(() -> service.update(RECORD_ID, OTHER_ACC, DEMAND_MBR, req("NEGOTIATE")))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode()).isEqualTo(3103));

        verify(matchRecordMapper, never()).update(any(), any(UpdateWrapper.class));
    }

    // ─── COMPLETE ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("COMPLETE：3(洽谈中) → 5(已完成) 成功")
    void complete_from_negotiating_success() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(buildRecord(3));
        when(matchRecordMapper.update(eq(null), any(UpdateWrapper.class))).thenReturn(1);

        MatchStatusUpdateVO vo = service.update(RECORD_ID, OTHER_ACC, RESOURCE_MBR, req("COMPLETE"));

        assertThat(vo.getStatus()).isEqualTo(5);
    }

    @Test
    @DisplayName("COMPLETE：2(已接受) → 5(已完成) 成功（跳过洽谈中）")
    void complete_from_accepted_success() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(buildRecord(2));
        when(matchRecordMapper.update(eq(null), any(UpdateWrapper.class))).thenReturn(1);

        MatchStatusUpdateVO vo = service.update(RECORD_ID, OTHER_ACC, DEMAND_MBR, req("COMPLETE"));

        assertThat(vo.getStatus()).isEqualTo(5);
    }

    @Test
    @DisplayName("COMPLETE：status=1 时返回 3103")
    void complete_fromPending_throws3103() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(buildRecord(1));

        assertThatThrownBy(() -> service.update(RECORD_ID, OTHER_ACC, DEMAND_MBR, req("COMPLETE")))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode()).isEqualTo(3103));

        verify(matchRecordMapper, never()).update(any(), any(UpdateWrapper.class));
    }

    // ─── CANCEL ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("CANCEL：status=1，发起方撤回 → 7(已撤销) 成功")
    void cancel_from_pending_by_initiator_success() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(buildRecord(1));
        when(matchRecordMapper.update(eq(null), any(UpdateWrapper.class))).thenReturn(1);

        MatchStatusUpdateVO vo = service.update(RECORD_ID, INITIATOR_ACC, RESOURCE_MBR, req("CANCEL"));

        assertThat(vo.getStatus()).isEqualTo(7);
    }

    @Test
    @DisplayName("CANCEL：status=1，非发起方尝试撤回 → 1003")
    void cancel_from_pending_by_nonInitiator_throws1003() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(buildRecord(1));

        assertThatThrownBy(() -> service.update(RECORD_ID, OTHER_ACC, DEMAND_MBR, req("CANCEL")))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode()).isEqualTo(1003));

        verify(matchRecordMapper, never()).update(any(), any(UpdateWrapper.class));
    }

    @Test
    @DisplayName("CANCEL：status=2，任一方均可撤销")
    void cancel_from_accepted_by_either_party_success() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(buildRecord(2));
        when(matchRecordMapper.update(eq(null), any(UpdateWrapper.class))).thenReturn(1);

        // 需求方（非发起方）撤销
        MatchStatusUpdateVO vo = service.update(RECORD_ID, OTHER_ACC, DEMAND_MBR, req("CANCEL"));

        assertThat(vo.getStatus()).isEqualTo(7);
    }

    @Test
    @DisplayName("CANCEL：status=5(已完成) 时返回 3103")
    void cancel_from_completed_throws3103() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(buildRecord(5));

        assertThatThrownBy(() -> service.update(RECORD_ID, OTHER_ACC, DEMAND_MBR, req("CANCEL")))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode()).isEqualTo(3103));

        verify(matchRecordMapper, never()).update(any(), any(UpdateWrapper.class));
    }

    // ─── 通用 ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("非双方成员操作 → 1003")
    void outsider_throws1003() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(buildRecord(2));

        Long outsider = 99L;
        assertThatThrownBy(() -> service.update(RECORD_ID, OTHER_ACC, outsider, req("COMPLETE")))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode()).isEqualTo(1003));
    }

    @Test
    @DisplayName("记录不存在 → 3001")
    void recordNotFound_throws3001() {
        when(matchRecordMapper.selectById(RECORD_ID)).thenReturn(null);

        assertThatThrownBy(() -> service.update(RECORD_ID, OTHER_ACC, DEMAND_MBR, req("COMPLETE")))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode()).isEqualTo(3001));
    }
}
