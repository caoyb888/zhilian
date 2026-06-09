package com.greenlink.glmessage.service;

import com.greenlink.common.util.PageResult;
import com.greenlink.glmessage.dto.response.MessageVO;
import com.greenlink.glmessage.dto.response.UnreadCountVO;

public interface MessageQueryService {

    /** 分页查询当前账号的站内信列表（channel 默认 SITE）。*/
    PageResult<MessageVO> pageList(Long accountId, String channel, String bizType,
                                   Boolean isRead, int page, int size);

    /** 按业务类型统计未读数（仅统计 SITE 频道）。*/
    UnreadCountVO unreadCount(Long accountId);

    /** 标记单条消息已读（越权时抛 BizException 1003）。*/
    void markRead(Long accountId, Long messageId);

    /** 全部标记已读；bizType 为空时全部处理，否则只处理该类型。*/
    void markAllRead(Long accountId, String bizType);
}
