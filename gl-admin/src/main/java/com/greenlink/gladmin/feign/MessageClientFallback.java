package com.greenlink.gladmin.feign;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.ChannelStatDTO;
import com.greenlink.gladmin.dto.response.MessageStatsVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Slf4j
@Component
public class MessageClientFallback implements MessageClient {

    @Override
    public Result<MessageStatsVO> getMessageStats() {
        log.warn("gl-message /internal/stats 调用失败，返回零值降级数据");
        ChannelStatDTO zero = new ChannelStatDTO();
        zero.setSuccessRate(BigDecimal.ZERO);
        MessageStatsVO vo = new MessageStatsVO();
        vo.setSite(zero);
        ChannelStatDTO zeroWc = new ChannelStatDTO();
        zeroWc.setSuccessRate(BigDecimal.ZERO);
        vo.setWechat(zeroWc);
        return Result.ok(vo);
    }
}
