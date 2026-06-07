package com.greenlink.glsupply.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glsupply.domain.SupplyAttachment;
import com.greenlink.glsupply.domain.SupplyDemand;
import com.greenlink.glsupply.dto.request.CreateDemandRequest;
import com.greenlink.glsupply.dto.request.UpdateDemandRequest;
import com.greenlink.glsupply.dto.response.DemandDetailVO;
import com.greenlink.glsupply.enums.AuditStatus;
import com.greenlink.glsupply.repository.SupplyAttachmentMapper;
import com.greenlink.glsupply.repository.SupplyDemandMapper;
import com.greenlink.glsupply.service.impl.SupplyDemandServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * S4-05 单元测试：需求发布 CRUD 核心场景
 */
@ExtendWith(MockitoExtension.class)
class SupplyDemandServiceTest {

    @Mock
    SupplyDemandMapper demandMapper;
    @Mock
    SupplyAttachmentMapper attachmentMapper;

    @InjectMocks
    SupplyDemandServiceImpl service;

    // ─────────────────────────────────────────────
    // TC-01  创建需求 — 含预算字段，状态为待审核
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-01 创建需求：包含预算字段，初始状态为待审核")
    void create_success_withBudgetFields() {
        doAnswer(inv -> {
            SupplyDemand d = inv.getArgument(0);
            d.setId(1L);
            return 1;
        }).when(demandMapper).insert(any(SupplyDemand.class));

        CreateDemandRequest request = new CreateDemandRequest();
        request.setType("PRODUCT");
        request.setTitle("急需光伏组件采购");
        request.setSummary("批量采购高效光伏组件");
        request.setProvince("山东省");
        request.setBudgetMin(new BigDecimal("50.00"));
        request.setBudgetMax(new BigDecimal("200.00"));

        DemandDetailVO result = service.create(request, 100L, 200L);

        assertThat(result.getMemberId()).isEqualTo(100L);
        assertThat(result.getAuditStatus()).isEqualTo(AuditStatus.PENDING.getCode());
        assertThat(result.getBudgetMin()).isEqualByComparingTo("50.00");
        assertThat(result.getBudgetMax()).isEqualByComparingTo("200.00");
    }

    // ─────────────────────────────────────────────
    // TC-02  查询详情 — 需求不存在
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-02 查询详情：需求不存在，抛出 DEMAND_NOT_FOUND")
    void getById_notFound_throwsBizException() {
        when(demandMapper.selectById(999L)).thenReturn(null);

        assertThatThrownBy(() -> service.getById(999L))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode())
                        .isEqualTo(ResultCode.DEMAND_NOT_FOUND.getCode()));
    }

    // ─────────────────────────────────────────────
    // TC-03  更新需求 — 非本账号，抛出权限异常
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-03 更新需求：非本账号操作，抛出 PERMISSION_DENIED")
    void update_notOwner_throwsPermissionDenied() {
        SupplyDemand demand = new SupplyDemand();
        demand.setId(1L);
        demand.setAccountId(200L);
        when(demandMapper.selectById(1L)).thenReturn(demand);

        UpdateDemandRequest request = new UpdateDemandRequest();
        request.setTitle("修改标题");

        assertThatThrownBy(() -> service.update(1L, request, 999L))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode())
                        .isEqualTo(ResultCode.PERMISSION_DENIED.getCode()));
    }

    // ─────────────────────────────────────────────
    // TC-04  更新需求 — 成功，审核状态重置为待审核
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-04 更新需求：成功后审核状态重置为待审核")
    void update_success_resetsAuditStatus() {
        SupplyDemand demand = new SupplyDemand();
        demand.setId(1L);
        demand.setAccountId(200L);
        demand.setAuditStatus(AuditStatus.APPROVED.getCode());
        when(demandMapper.selectById(1L)).thenReturn(demand);
        when(demandMapper.updateById(any(SupplyDemand.class))).thenReturn(1);
        when(attachmentMapper.selectList(any())).thenReturn(List.of());

        UpdateDemandRequest request = new UpdateDemandRequest();
        request.setTitle("更新后的需求标题");
        request.setBudgetMax(new BigDecimal("500.00"));

        DemandDetailVO result = service.update(1L, request, 200L);

        assertThat(result.getAuditStatus()).isEqualTo(AuditStatus.PENDING.getCode());
        assertThat(result.getTitle()).isEqualTo("更新后的需求标题");
        assertThat(result.getBudgetMax()).isEqualByComparingTo("500.00");
    }

    // ─────────────────────────────────────────────
    // TC-05  软删除 — 成功
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-05 软删除：调用 deleteById 而非物理删除")
    void delete_success_callsDeleteById() {
        SupplyDemand demand = new SupplyDemand();
        demand.setId(1L);
        demand.setAccountId(200L);
        when(demandMapper.selectById(1L)).thenReturn(demand);
        when(demandMapper.deleteById(1L)).thenReturn(1);
        when(attachmentMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(0);

        service.delete(1L, 200L);

        verify(demandMapper).deleteById(1L);
        verify(attachmentMapper).delete(any(LambdaQueryWrapper.class));
    }

    // ─────────────────────────────────────────────
    // TC-06  关闭需求 — 仅 APPROVED 状态可关闭
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-06 关闭需求：auditStatus 变更为 OFFLINE(3)")
    void close_success_setsOfflineStatus() {
        SupplyDemand demand = new SupplyDemand();
        demand.setId(1L);
        demand.setAccountId(200L);
        demand.setAuditStatus(AuditStatus.APPROVED.getCode());
        when(demandMapper.selectById(1L)).thenReturn(demand);

        ArgumentCaptor<SupplyDemand> captor = ArgumentCaptor.forClass(SupplyDemand.class);
        when(demandMapper.updateById(captor.capture())).thenReturn(1);

        service.close(1L, 200L);

        assertThat(captor.getValue().getAuditStatus()).isEqualTo(AuditStatus.OFFLINE.getCode());
    }

    // ─────────────────────────────────────────────
    // TC-07  关闭需求 — 非 APPROVED 状态抛出异常
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-07 关闭需求：非已发布状态，抛出 DEMAND_AUDIT_INVALID_STATUS")
    void close_notApproved_throwsException() {
        SupplyDemand demand = new SupplyDemand();
        demand.setId(1L);
        demand.setAccountId(200L);
        demand.setAuditStatus(AuditStatus.PENDING.getCode());
        when(demandMapper.selectById(1L)).thenReturn(demand);

        assertThatThrownBy(() -> service.close(1L, 200L))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode())
                        .isEqualTo(ResultCode.DEMAND_AUDIT_INVALID_STATUS.getCode()));
    }
}
