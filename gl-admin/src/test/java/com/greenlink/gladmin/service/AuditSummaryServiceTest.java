package com.greenlink.gladmin.service;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.AuditDailyStat;
import com.greenlink.gladmin.dto.response.AuditSummaryVO;
import com.greenlink.gladmin.feign.MatchClient;
import com.greenlink.gladmin.feign.MemberClient;
import com.greenlink.gladmin.feign.SupplyClient;
import com.greenlink.gladmin.service.impl.DashboardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("S7-02 审核汇总 Service 单元测试")
class AuditSummaryServiceTest {

    @Mock private MemberClient memberClient;
    @Mock private SupplyClient supplyClient;
    @Mock private MatchClient matchClient;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    private AuditSummaryVO normalSummary;

    @BeforeEach
    void setUp() {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        List<AuditDailyStat> days = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            AuditDailyStat stat = new AuditDailyStat();
            stat.setDate(LocalDate.now().minusDays(i).format(fmt));
            stat.setAuditedCount(i * 2L);
            days.add(stat);
        }
        normalSummary = new AuditSummaryVO();
        normalSummary.setPendingResourceCount(10L);
        normalSummary.setPendingDemandCount(5L);
        normalSummary.setTotalPendingAudit(15L);
        normalSummary.setLast7DaysAudit(days);
    }

    @Test
    @DisplayName("正常场景：返回待审核数 + 7 日逐日明细")
    void getAuditSummary_normalData_returns7DayDetails() {
        when(supplyClient.getAuditSummary()).thenReturn(Result.ok(normalSummary));

        AuditSummaryVO vo = dashboardService.getAuditSummary();

        assertThat(vo.getTotalPendingAudit()).isEqualTo(15L);
        assertThat(vo.getPendingResourceCount()).isEqualTo(10L);
        assertThat(vo.getPendingDemandCount()).isEqualTo(5L);
        assertThat(vo.getLast7DaysAudit()).hasSize(7);
    }

    @Test
    @DisplayName("7 日列表升序：index 0 为 6 天前，index 6 为今天")
    void getAuditSummary_last7Days_ascendingOrder() {
        when(supplyClient.getAuditSummary()).thenReturn(Result.ok(normalSummary));

        AuditSummaryVO vo = dashboardService.getAuditSummary();
        List<AuditDailyStat> days = vo.getLast7DaysAudit();

        String expectedFirst = LocalDate.now().minusDays(6)
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        String expectedLast  = LocalDate.now()
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        assertThat(days.get(0).getDate()).isEqualTo(expectedFirst);
        assertThat(days.get(6).getDate()).isEqualTo(expectedLast);
    }

    @Test
    @DisplayName("降级场景：gl-supply 抛异常，返回空列表零值，不影响整体")
    void getAuditSummary_supplyClientThrows_returnsEmptyFallback() {
        when(supplyClient.getAuditSummary()).thenThrow(new RuntimeException("连接超时"));

        AuditSummaryVO vo = dashboardService.getAuditSummary();

        assertThat(vo.getTotalPendingAudit()).isZero();
        assertThat(vo.getLast7DaysAudit()).isEmpty();
    }

    @Test
    @DisplayName("降级场景：Feign 返回业务错误码，降级为零值")
    void getAuditSummary_feignErrorCode_returnsEmptyFallback() {
        when(supplyClient.getAuditSummary()).thenReturn(Result.fail(1001, "服务错误"));

        AuditSummaryVO vo = dashboardService.getAuditSummary();

        assertThat(vo.getTotalPendingAudit()).isZero();
        assertThat(vo.getLast7DaysAudit()).isEmpty();
    }

    @Test
    @DisplayName("空数据：近7日无任何审核，每日 auditedCount 均为 0")
    void getAuditSummary_noAuditInLast7Days_allZeroCounts() {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        List<AuditDailyStat> zeroDays = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            AuditDailyStat stat = new AuditDailyStat();
            stat.setDate(LocalDate.now().minusDays(i).format(fmt));
            stat.setAuditedCount(0L);
            zeroDays.add(stat);
        }
        AuditSummaryVO zeroSummary = new AuditSummaryVO();
        zeroSummary.setLast7DaysAudit(zeroDays);

        when(supplyClient.getAuditSummary()).thenReturn(Result.ok(zeroSummary));

        AuditSummaryVO vo = dashboardService.getAuditSummary();

        assertThat(vo.getLast7DaysAudit()).hasSize(7);
        assertThat(vo.getLast7DaysAudit()).allMatch(d -> d.getAuditedCount() == 0L);
    }
}
