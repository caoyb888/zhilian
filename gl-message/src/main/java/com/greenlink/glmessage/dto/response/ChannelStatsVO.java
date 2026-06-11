package com.greenlink.glmessage.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Data
public class ChannelStatsVO {
    /** 已处理（已发送 + 失败）消息数 */
    private long totalProcessed;
    /** 已成功发送数（send_status=1） */
    private long successCount;
    /** 发送失败数（send_status=2） */
    private long failedCount;
    /** 发送成功率（0-100.00），无已处理消息时为 0 */
    private BigDecimal successRate;

    public static ChannelStatsVO of(long success, long failed) {
        ChannelStatsVO vo = new ChannelStatsVO();
        vo.setSuccessCount(success);
        vo.setFailedCount(failed);
        long total = success + failed;
        vo.setTotalProcessed(total);
        vo.setSuccessRate(total == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(success * 100L)
                        .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP));
        return vo;
    }
}
