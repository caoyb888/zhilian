package com.greenlink.gladmin.dto.response;

import lombok.Data;

/**
 * 管理端消息发送统计 VO（S7-05）：站内信 + 微信发送成功率。
 */
@Data
public class MessageStatsVO {
    /** 站内信（SITE）发送统计 */
    private ChannelStatDTO site;
    /** 微信（WECHAT）发送统计 */
    private ChannelStatDTO wechat;
}
