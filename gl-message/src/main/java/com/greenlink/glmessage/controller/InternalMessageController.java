package com.greenlink.glmessage.controller;

import com.greenlink.common.result.Result;
import com.greenlink.glmessage.dto.response.ChannelStatsVO;
import com.greenlink.glmessage.dto.response.MessageStatsVO;
import com.greenlink.glmessage.repository.MessageNotificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/messages/internal")
@RequiredArgsConstructor
public class InternalMessageController {

    private final MessageNotificationMapper mapper;

    /**
     * 内部消息发送统计（S7-05）：站内信 + 微信发送成功率。
     * 供 gl-admin BFF Feign 调用，无需鉴权。
     * 成功率 = 已发送数 / (已发送 + 失败)，不含待发送（send_status=0）。
     */
    @GetMapping("/stats")
    public Result<MessageStatsVO> stats() {
        long siteSent   = mapper.countByChannelAndStatus("SITE",   1);
        long siteFailed = mapper.countByChannelAndStatus("SITE",   2);
        long wcSent     = mapper.countByChannelAndStatus("WECHAT", 1);
        long wcFailed   = mapper.countByChannelAndStatus("WECHAT", 2);

        MessageStatsVO vo = new MessageStatsVO();
        vo.setSite(ChannelStatsVO.of(siteSent, siteFailed));
        vo.setWechat(ChannelStatsVO.of(wcSent, wcFailed));
        return Result.ok(vo);
    }
}
