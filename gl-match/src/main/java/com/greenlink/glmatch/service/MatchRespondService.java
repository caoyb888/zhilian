package com.greenlink.glmatch.service;

import com.greenlink.glmatch.dto.request.MatchRespondRequest;
import com.greenlink.glmatch.dto.response.MatchRespondVO;

public interface MatchRespondService {

    /**
     * 响应对接申请（接受或拒绝）。
     *
     * <p>状态机：仅允许 status=1(待响应) → 2(已接受) 或 6(已拒绝)。
     * 其他状态流转返回 code:3103。
     *
     * @param recordId  对接记录 ID
     * @param accountId 响应方账号 ID（来自 Gateway X-Account-Id，不得与 initiatorId 相同）
     * @param memberId  响应方会员 ID（来自 Gateway X-Member-Id，必须是对接双方之一）
     * @param req       响应请求体
     * @return 更新后的对接记录摘要
     */
    MatchRespondVO respond(Long recordId, Long accountId, Long memberId, MatchRespondRequest req);
}
