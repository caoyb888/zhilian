package com.greenlink.gladmin.service;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.DashboardOverviewVO;
import com.greenlink.gladmin.dto.response.MatchStatsDTO;
import com.greenlink.gladmin.dto.response.MemberStatsDTO;
import com.greenlink.gladmin.dto.response.SupplyStatsDTO;
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

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("S7-01 DashboardService 单元测试")
class DashboardServiceImplTest {

    @Mock
    private MemberClient memberClient;
    @Mock
    private SupplyClient supplyClient;
    @Mock
    private MatchClient matchClient;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    private MemberStatsDTO memberStats;
    private SupplyStatsDTO supplyStats;
    private MatchStatsDTO matchStats;

    @BeforeEach
    void setUp() {
        memberStats = new MemberStatsDTO();
        memberStats.setTotalMembers(120L);
        memberStats.setNewMembersThisMonth(8L);

        supplyStats = new SupplyStatsDTO();
        supplyStats.setPendingResourceCount(10L);
        supplyStats.setPendingDemandCount(5L);
        supplyStats.setTotalPendingAudit(15L);

        matchStats = new MatchStatsDTO();
        matchStats.setTotalMatchCount(340L);
        matchStats.setCompletedMatchCount(144L);
        matchStats.setSuccessRate(new BigDecimal("42.35"));
    }

    @Test
    @DisplayName("正常场景：三服务均返回数据，5个指标正确聚合")
    void getOverview_allServicesOk_returnsAggregated() {
        when(memberClient.getStats()).thenReturn(Result.ok(memberStats));
        when(supplyClient.getStats()).thenReturn(Result.ok(supplyStats));
        when(matchClient.getStats()).thenReturn(Result.ok(matchStats));

        DashboardOverviewVO vo = dashboardService.getOverview();

        assertThat(vo.getTotalMembers()).isEqualTo(120L);
        assertThat(vo.getNewMembersThisMonth()).isEqualTo(8L);
        assertThat(vo.getPendingAuditCount()).isEqualTo(15L);
        assertThat(vo.getTotalMatchCount()).isEqualTo(340L);
        assertThat(vo.getMatchSuccessRate()).isEqualByComparingTo("42.35");
    }

    @Test
    @DisplayName("降级场景：gl-member 抛异常，会员指标降级为 0，其余正常")
    void getOverview_memberClientThrows_degradesGracefully() {
        when(memberClient.getStats()).thenThrow(new RuntimeException("连接超时"));
        when(supplyClient.getStats()).thenReturn(Result.ok(supplyStats));
        when(matchClient.getStats()).thenReturn(Result.ok(matchStats));

        DashboardOverviewVO vo = dashboardService.getOverview();

        assertThat(vo.getTotalMembers()).isZero();
        assertThat(vo.getNewMembersThisMonth()).isZero();
        assertThat(vo.getPendingAuditCount()).isEqualTo(15L);
        assertThat(vo.getTotalMatchCount()).isEqualTo(340L);
    }

    @Test
    @DisplayName("降级场景：gl-supply 抛异常，待审核数降级为 0")
    void getOverview_supplyClientThrows_degradesGracefully() {
        when(memberClient.getStats()).thenReturn(Result.ok(memberStats));
        when(supplyClient.getStats()).thenThrow(new RuntimeException("服务不可用"));
        when(matchClient.getStats()).thenReturn(Result.ok(matchStats));

        DashboardOverviewVO vo = dashboardService.getOverview();

        assertThat(vo.getTotalMembers()).isEqualTo(120L);
        assertThat(vo.getPendingAuditCount()).isZero();
        assertThat(vo.getTotalMatchCount()).isEqualTo(340L);
    }

    @Test
    @DisplayName("降级场景：gl-match 抛异常，对接指标降级为 0，成功率为 0")
    void getOverview_matchClientThrows_degradesGracefully() {
        when(memberClient.getStats()).thenReturn(Result.ok(memberStats));
        when(supplyClient.getStats()).thenReturn(Result.ok(supplyStats));
        when(matchClient.getStats()).thenThrow(new RuntimeException("超时"));

        DashboardOverviewVO vo = dashboardService.getOverview();

        assertThat(vo.getPendingAuditCount()).isEqualTo(15L);
        assertThat(vo.getTotalMatchCount()).isZero();
        assertThat(vo.getMatchSuccessRate()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("空数据场景：所有服务返回 0，5个指标均为 0")
    void getOverview_allZeroData_returns5Zeros() {
        MemberStatsDTO emptyMember = new MemberStatsDTO();
        SupplyStatsDTO emptySupply = new SupplyStatsDTO();
        MatchStatsDTO emptyMatch = new MatchStatsDTO();
        emptyMatch.setSuccessRate(BigDecimal.ZERO);

        when(memberClient.getStats()).thenReturn(Result.ok(emptyMember));
        when(supplyClient.getStats()).thenReturn(Result.ok(emptySupply));
        when(matchClient.getStats()).thenReturn(Result.ok(emptyMatch));

        DashboardOverviewVO vo = dashboardService.getOverview();

        assertThat(vo.getTotalMembers()).isZero();
        assertThat(vo.getNewMembersThisMonth()).isZero();
        assertThat(vo.getPendingAuditCount()).isZero();
        assertThat(vo.getTotalMatchCount()).isZero();
        assertThat(vo.getMatchSuccessRate()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("返回码非 0：Feign 返回业务错误，降级为零值")
    void getOverview_feignReturnsErrorCode_degradesGracefully() {
        when(memberClient.getStats()).thenReturn(Result.fail(1001, "服务错误"));
        when(supplyClient.getStats()).thenReturn(Result.ok(supplyStats));
        when(matchClient.getStats()).thenReturn(Result.ok(matchStats));

        DashboardOverviewVO vo = dashboardService.getOverview();

        assertThat(vo.getTotalMembers()).isZero();
        assertThat(vo.getPendingAuditCount()).isEqualTo(15L);
    }
}
