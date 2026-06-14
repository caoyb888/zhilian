package com.greenlink.gladmin.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.gladmin.dto.response.AuditDailyStat;
import com.greenlink.gladmin.dto.response.AuditSummaryVO;
import com.greenlink.gladmin.dto.response.ChannelStatDTO;
import com.greenlink.gladmin.dto.response.DashboardOverviewVO;
import com.greenlink.gladmin.dto.response.IndustryDistStat;
import com.greenlink.gladmin.dto.response.MatchDetailStatsVO;
import com.greenlink.gladmin.dto.response.MatchTrendDailyStat;
import com.greenlink.gladmin.dto.response.MemberDetailStatsVO;
import com.greenlink.gladmin.dto.response.MessageStatsVO;
import com.greenlink.gladmin.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * S7-14 接口自动化测试：管理端数据看板（8 个用例）。
 * standaloneSetup 模式，无 Spring 上下文，纯 Mockito。
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("S7-14 管理端看板接口自动化测试（8 个用例）")
class DashboardControllerTest {

    private static final String BASE = "/api/v1/admin/dashboard";

    private MockMvc mockMvc;

    @Mock
    private DashboardService dashboardService;

    @InjectMocks
    private DashboardController controller;

    private DashboardOverviewVO overview;
    private AuditSummaryVO auditSummary;
    private MatchDetailStatsVO matchStats;
    private MemberDetailStatsVO memberStats;
    private MessageStatsVO messageStats;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(new ObjectMapper()))
                .build();

        overview = new DashboardOverviewVO();
        overview.setTotalMembers(120L);
        overview.setNewMembersThisMonth(8L);
        overview.setPendingAuditCount(15L);
        overview.setTotalMatchCount(340L);
        overview.setMatchSuccessRate(new BigDecimal("42.35"));

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        List<AuditDailyStat> auditDays = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            AuditDailyStat s = new AuditDailyStat();
            s.setDate(LocalDate.now().minusDays(i).format(fmt));
            s.setAuditedCount(i * 2L);
            auditDays.add(s);
        }
        auditSummary = new AuditSummaryVO();
        auditSummary.setPendingResourceCount(10L);
        auditSummary.setPendingDemandCount(5L);
        auditSummary.setTotalPendingAudit(15L);
        auditSummary.setLast7DaysAudit(auditDays);

        List<MatchTrendDailyStat> trend = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            MatchTrendDailyStat s = new MatchTrendDailyStat();
            s.setDate(LocalDate.now().minusDays(i).format(fmt));
            s.setNewMatchCount(i % 5);
            trend.add(s);
        }
        matchStats = new MatchDetailStatsVO();
        matchStats.setTotalMatchCount(340L);
        matchStats.setCompletedMatchCount(144L);
        matchStats.setSuccessRate(new BigDecimal("42.35"));
        matchStats.setLast30DaysTrend(trend);

        IndustryDistStat dist = new IndustryDistStat();
        dist.setIndustry("新能源");
        dist.setCount(35L);
        memberStats = new MemberDetailStatsVO();
        memberStats.setTotalMembers(120L);
        memberStats.setNewMembersThisMonth(8L);
        memberStats.setIndustryDistribution(List.of(dist));

        ChannelStatDTO site = new ChannelStatDTO();
        site.setTotalProcessed(850L);
        site.setSuccessCount(840L);
        site.setFailedCount(10L);
        site.setSuccessRate(new BigDecimal("98.82"));
        ChannelStatDTO wechat = new ChannelStatDTO();
        wechat.setTotalProcessed(120L);
        wechat.setSuccessCount(98L);
        wechat.setFailedCount(22L);
        wechat.setSuccessRate(new BigDecimal("81.67"));
        messageStats = new MessageStatsVO();
        messageStats.setSite(site);
        messageStats.setWechat(wechat);
    }

    @Test
    @DisplayName("TC01: GET /overview 返回 HTTP 200 且 code=0")
    void tc01_overview_returns200AndCodeZero() throws Exception {
        when(dashboardService.getOverview()).thenReturn(overview);

        mockMvc.perform(get(BASE + "/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data").exists());
    }

    @Test
    @DisplayName("TC02: /overview 响应 data 包含 5 个核心指标且值正确")
    void tc02_overview_dataContains5MetricFields() throws Exception {
        when(dashboardService.getOverview()).thenReturn(overview);

        mockMvc.perform(get(BASE + "/overview"))
                .andExpect(jsonPath("$.data.totalMembers").value(120))
                .andExpect(jsonPath("$.data.newMembersThisMonth").value(8))
                .andExpect(jsonPath("$.data.pendingAuditCount").value(15))
                .andExpect(jsonPath("$.data.totalMatchCount").value(340))
                .andExpect(jsonPath("$.data.matchSuccessRate").value(42.35));
    }

    @Test
    @DisplayName("TC03: GET /audit-summary 返回 code=0 且 last7DaysAudit 长度=7")
    void tc03_auditSummary_last7DaysHasSize7() throws Exception {
        when(dashboardService.getAuditSummary()).thenReturn(auditSummary);

        mockMvc.perform(get(BASE + "/audit-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.last7DaysAudit", hasSize(7)));
    }

    @Test
    @DisplayName("TC04: GET /match-stats 返回 code=0 且 last30DaysTrend 长度=30")
    void tc04_matchStats_last30DaysTrendHasSize30() throws Exception {
        when(dashboardService.getMatchDetailStats()).thenReturn(matchStats);

        mockMvc.perform(get(BASE + "/match-stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.last30DaysTrend", hasSize(30)));
    }

    @Test
    @DisplayName("TC05: GET /member-stats 返回 code=0 且 industryDistribution 列表非空")
    void tc05_memberStats_industryDistributionNonEmpty() throws Exception {
        when(dashboardService.getMemberDetailStats()).thenReturn(memberStats);

        mockMvc.perform(get(BASE + "/member-stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.industryDistribution").isArray())
                .andExpect(jsonPath("$.data.industryDistribution", hasSize(greaterThan(0))));
    }

    @Test
    @DisplayName("TC06: GET /message-stats 返回 code=0 且 site/wechat 双渠道成功率均存在")
    void tc06_messageStats_bothChannelsPresentWithSuccessRate() throws Exception {
        when(dashboardService.getMessageStats()).thenReturn(messageStats);

        mockMvc.perform(get(BASE + "/message-stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.site.successRate").value(98.82))
                .andExpect(jsonPath("$.data.wechat.successRate").value(81.67));
    }

    @Test
    @DisplayName("TC07: 任意接口响应均含 timestamp 字段且值大于 0")
    void tc07_response_timestampFieldIsPositive() throws Exception {
        when(dashboardService.getOverview()).thenReturn(overview);

        mockMvc.perform(get(BASE + "/overview"))
                .andExpect(jsonPath("$.timestamp").isNumber())
                .andExpect(jsonPath("$.timestamp").value(greaterThan(0L)));
    }

    @Test
    @DisplayName("TC08: Service 抛出 RuntimeException 时，HTTP 200 且 code=1000（系统错误）")
    void tc08_overview_serviceThrows_returns200WithSystemErrorCode() throws Exception {
        when(dashboardService.getOverview()).thenThrow(new RuntimeException("模拟服务崩溃"));

        mockMvc.perform(get(BASE + "/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }
}
