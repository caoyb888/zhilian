package com.greenlink.gladmin.service;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.ChannelStatDTO;
import com.greenlink.gladmin.dto.response.MessageStatsVO;
import com.greenlink.gladmin.feign.MatchClient;
import com.greenlink.gladmin.feign.MemberClient;
import com.greenlink.gladmin.feign.MessageClient;
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
@DisplayName("S7-05 消息发送统计 Service 单元测试")
class MessageStatsServiceTest {

    @Mock private MemberClient memberClient;
    @Mock private SupplyClient supplyClient;
    @Mock private MatchClient matchClient;
    @Mock private MessageClient messageClient;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    private MessageStatsVO normalStats;

    @BeforeEach
    void setUp() {
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

        normalStats = new MessageStatsVO();
        normalStats.setSite(site);
        normalStats.setWechat(wechat);
    }

    @Test
    @DisplayName("正常场景：返回站内信和微信双渠道统计")
    void getMessageStats_normalData_returnsBothChannels() {
        when(messageClient.getMessageStats()).thenReturn(Result.ok(normalStats));

        MessageStatsVO vo = dashboardService.getMessageStats();

        assertThat(vo.getSite().getTotalProcessed()).isEqualTo(850L);
        assertThat(vo.getSite().getSuccessRate()).isEqualByComparingTo("98.82");
        assertThat(vo.getWechat().getTotalProcessed()).isEqualTo(120L);
        assertThat(vo.getWechat().getSuccessRate()).isEqualByComparingTo("81.67");
    }

    @Test
    @DisplayName("成功率范围：站内信 > 微信（正常业务场景）")
    void getMessageStats_siteRateHigherThanWechat() {
        when(messageClient.getMessageStats()).thenReturn(Result.ok(normalStats));

        MessageStatsVO vo = dashboardService.getMessageStats();

        assertThat(vo.getSite().getSuccessRate())
                .isGreaterThan(vo.getWechat().getSuccessRate());
    }

    @Test
    @DisplayName("降级场景：gl-message 抛异常，双渠道均返回零值")
    void getMessageStats_messageClientThrows_returnsZeroFallback() {
        when(messageClient.getMessageStats()).thenThrow(new RuntimeException("服务不可用"));

        MessageStatsVO vo = dashboardService.getMessageStats();

        assertThat(vo.getSite().getSuccessRate()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(vo.getWechat().getSuccessRate()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(vo.getSite().getTotalProcessed()).isZero();
        assertThat(vo.getWechat().getTotalProcessed()).isZero();
    }

    @Test
    @DisplayName("降级场景：Feign 返回业务错误码，双渠道降级为零值")
    void getMessageStats_feignErrorCode_returnsZeroFallback() {
        when(messageClient.getMessageStats()).thenReturn(Result.fail(5001, "服务错误"));

        MessageStatsVO vo = dashboardService.getMessageStats();

        assertThat(vo.getSite().getSuccessRate()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(vo.getWechat().getSuccessRate()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("空数据：无任何已发送消息，成功率均为 0")
    void getMessageStats_noSentMessages_zeroRates() {
        ChannelStatDTO zeroSite = new ChannelStatDTO();
        zeroSite.setSuccessRate(BigDecimal.ZERO);
        ChannelStatDTO zeroWc = new ChannelStatDTO();
        zeroWc.setSuccessRate(BigDecimal.ZERO);
        MessageStatsVO empty = new MessageStatsVO();
        empty.setSite(zeroSite);
        empty.setWechat(zeroWc);

        when(messageClient.getMessageStats()).thenReturn(Result.ok(empty));

        MessageStatsVO vo = dashboardService.getMessageStats();

        assertThat(vo.getSite().getSuccessRate()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(vo.getWechat().getSuccessRate()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
