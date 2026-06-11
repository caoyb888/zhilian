package com.greenlink.glmessage.dto.response;

import lombok.Data;

@Data
public class MessageStatsVO {
    /** 站内信（SITE 渠道）发送统计 */
    private ChannelStatsVO site;
    /** 微信（WECHAT 渠道）发送统计 */
    private ChannelStatsVO wechat;
}
