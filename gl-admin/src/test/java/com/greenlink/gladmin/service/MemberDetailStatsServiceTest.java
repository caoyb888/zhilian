package com.greenlink.gladmin.service;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.IndustryDistStat;
import com.greenlink.gladmin.dto.response.MemberDetailStatsVO;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("S7-04 会员数据统计 Service 单元测试")
class MemberDetailStatsServiceTest {

    @Mock private MemberClient memberClient;
    @Mock private SupplyClient supplyClient;
    @Mock private MatchClient matchClient;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    private MemberDetailStatsVO normalStats;

    @BeforeEach
    void setUp() {
        IndustryDistStat s1 = new IndustryDistStat();
        s1.setIndustry("新能源");
        s1.setCount(35L);
        IndustryDistStat s2 = new IndustryDistStat();
        s2.setIndustry("节能环保");
        s2.setCount(28L);
        IndustryDistStat s3 = new IndustryDistStat();
        s3.setIndustry("碳汇");
        s3.setCount(15L);

        normalStats = new MemberDetailStatsVO();
        normalStats.setTotalMembers(120L);
        normalStats.setNewMembersThisMonth(8L);
        normalStats.setIndustryDistribution(List.of(s1, s2, s3));
    }

    @Test
    @DisplayName("正常场景：返回总会员数、本月新增、行业分布")
    void getMemberDetailStats_normalData_returnsAllFields() {
        when(memberClient.getMemberDetailStats()).thenReturn(Result.ok(normalStats));

        MemberDetailStatsVO vo = dashboardService.getMemberDetailStats();

        assertThat(vo.getTotalMembers()).isEqualTo(120L);
        assertThat(vo.getNewMembersThisMonth()).isEqualTo(8L);
        assertThat(vo.getIndustryDistribution()).hasSize(3);
    }

    @Test
    @DisplayName("行业分布降序：第一条 count 最大")
    void getMemberDetailStats_industryDist_descendingOrder() {
        when(memberClient.getMemberDetailStats()).thenReturn(Result.ok(normalStats));

        MemberDetailStatsVO vo = dashboardService.getMemberDetailStats();
        List<IndustryDistStat> dist = vo.getIndustryDistribution();

        assertThat(dist.get(0).getIndustry()).isEqualTo("新能源");
        assertThat(dist.get(0).getCount()).isGreaterThanOrEqualTo(dist.get(1).getCount());
        assertThat(dist.get(1).getCount()).isGreaterThanOrEqualTo(dist.get(2).getCount());
    }

    @Test
    @DisplayName("降级场景：gl-member 抛异常，返回零值空分布")
    void getMemberDetailStats_memberClientThrows_returnsZeroFallback() {
        when(memberClient.getMemberDetailStats()).thenThrow(new RuntimeException("连接超时"));

        MemberDetailStatsVO vo = dashboardService.getMemberDetailStats();

        assertThat(vo.getTotalMembers()).isZero();
        assertThat(vo.getIndustryDistribution()).isEmpty();
    }

    @Test
    @DisplayName("降级场景：Feign 返回业务错误码，降级为零值")
    void getMemberDetailStats_feignErrorCode_returnsZeroFallback() {
        when(memberClient.getMemberDetailStats()).thenReturn(Result.fail(1001, "服务错误"));

        MemberDetailStatsVO vo = dashboardService.getMemberDetailStats();

        assertThat(vo.getTotalMembers()).isZero();
        assertThat(vo.getIndustryDistribution()).isEmpty();
    }

    @Test
    @DisplayName("空数据：无会员，行业分布为空列表")
    void getMemberDetailStats_noMembers_returnsEmptyDistribution() {
        MemberDetailStatsVO empty = new MemberDetailStatsVO();
        empty.setIndustryDistribution(List.of());

        when(memberClient.getMemberDetailStats()).thenReturn(Result.ok(empty));

        MemberDetailStatsVO vo = dashboardService.getMemberDetailStats();

        assertThat(vo.getTotalMembers()).isZero();
        assertThat(vo.getIndustryDistribution()).isEmpty();
    }
}
