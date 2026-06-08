package com.greenlink.glmatch.service;

import com.greenlink.common.util.PageResult;
import com.greenlink.glmatch.dto.request.SendMessageRequest;
import com.greenlink.glmatch.dto.response.MarkReadVO;
import com.greenlink.glmatch.dto.response.MatchMessageVO;

public interface MatchMessageService {

    /**
     * 发送消息（发起方/被申请方均可）。
     * 对接记录须处于活跃状态（status 1/2/3）。
     */
    MatchMessageVO send(Long matchId, Long accountId, Long memberId, SendMessageRequest req);

    /**
     * 分页查询消息历史（按 created_at ASC），同时将对方发来的未读消息标记为已读。
     */
    PageResult<MatchMessageVO> listMessages(Long matchId, Long accountId, Long memberId, int page, int size);

    /**
     * 显式将该对接中所有来自对方的未读消息标记为已读。
     */
    MarkReadVO markAllRead(Long matchId, Long accountId, Long memberId);
}
