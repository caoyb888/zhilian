package com.greenlink.gladmin.service;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.MatchDetailStatsVO;
import com.greenlink.gladmin.dto.response.MatchTrendDailyStat;
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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("S7-03 对接数据统计 Service 单元测试")
class MatchDetailStatsServiceTest {

    @Mock private MemberClient memberClient;
    @Mock private SupplyClient supplyClient;
    @Mock private MatchClient matchClient;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    private MatchDetailStatsVO normalStats;

    @BeforeEach
    void setUp() {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        List<MatchTrendDailyStat> trend = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            MatchTrendDailyStat stat = new MatchTrendDailyStat();
            stat.setDate(LocalDate.now().minusDays(i).format(fmt));
            stat.setNewMatchCount(i % 5);
            trend.add(stat);
        }
        normalStats = new MatchDetailStatsVO();
        normalStats.setTotalMatchCount(340L);
        normalStats.setCompletedMatchCount(144L);
        normalStats.setSuccessRate(new BigDecimal("42.35"));
        normalStats.setLast30DaysTrend(trend);
    }

    @Test
    @DisplayName("正常场景：返回总对接数、成功率、30日趋势")
    void getMatchDetailStats_normalData_returnsAllFields() {
        when(matchClient.getMatchDetailStats()).thenReturn(Result.ok(normalStats));

        MatchDetailStatsVO vo = dashboardService.getMatchDetailStats();

        assertThat(vo.getTotalMatchCount()).isEqualTo(340L);
        assertThat(vo.getCompletedMatchCount()).isEqualTo(144L);
        assertThat(vo.getSuccessRate()).isEqualByComparingTo("42.35");
        assertThat(vo.getLast30DaysTrend()).hasSize(30);
    }

    @Test
    @DisplayName("30日趋势升序：index 0 为29天前，index 29 为今天")
    void getMatchDetailStats_trend_ascendingOrder() {
        when(matchClient.getMatchDetailStats()).thenReturn(Result.ok(normalStats));

        MatchDetailStatsVO vo = dashboardService.getMatchDetailStats();
        List<MatchTrendDailyStat> trend = vo.getLast30DaysTrend();

        String expectedFirst = LocalDate.now().minusDays(29)
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        String expectedLast  = LocalDate.now()
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        assertThat(trend.get(0).getDate()).isEqualTo(expectedFirst);
        assertThat(trend.get(29).getDate()).isEqualTo(expectedLast);
    }

    @Test
    @DisplayName("降级场景：gl-match 抛异常，返回零值空趋势")
    void getMatchDetailStats_matchClientThrows_returnsZeroFallback() {
        when(matchClient.getMatchDetailStats()).thenThrow(new RuntimeException("超时"));

        MatchDetailStatsVO vo = dashboardService.getMatchDetailStats();

        assertThat(vo.getTotalMatchCount()).isZero();
        assertThat(vo.getSuccessRate()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(vo.getLast30DaysTrend()).isEmpty();
    }

    @Test
    @DisplayName("降级场景：Feign 返回业务错误码，降级为零值")
    void getMatchDetailStats_feignErrorCode_returnsZeroFallback() {
        when(matchClient.getMatchDetailStats()).thenReturn(Result.fail(1001, "服务错误"));

        MatchDetailStatsVO vo = dashboardService.getMatchDetailStats();

        assertThat(vo.getTotalMatchCount()).isZero();
        assertThat(vo.getLast30DaysTrend()).isEmpty();
    }

    @Test
    @DisplayName("空数据：近30日无任何对接，trend 每日 newMatchCount=0")
    void getMatchDetailStats_noMatchIn30Days_allZeroTrend() {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        List<MatchTrendDailyStat> zeroTrend = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            MatchTrendDailyStat stat = new MatchTrendDailyStat();
            stat.setDate(LocalDate.now().minusDays(i).format(fmt));
            stat.setNewMatchCount(0L);
            zeroTrend.add(stat);
        }
        MatchDetailStatsVO zeroStats = new MatchDetailStatsVO();
        zeroStats.setSuccessRate(BigDecimal.ZERO);
        zeroStats.setLast30DaysTrend(zeroTrend);

        when(matchClient.getMatchDetailStats()).thenReturn(Result.ok(zeroStats));

        MatchDetailStatsVO vo = dashboardService.getMatchDetailStats();

        assertThat(vo.getLast30DaysTrend()).hasSize(30);
        assertThat(vo.getLast30DaysTrend()).allMatch(d -> d.getNewMatchCount() == 0L);
    }
}
