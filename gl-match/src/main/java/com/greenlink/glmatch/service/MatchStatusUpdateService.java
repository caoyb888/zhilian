package com.greenlink.glmatch.service;

import com.greenlink.glmatch.dto.request.MatchStatusUpdateRequest;
import com.greenlink.glmatch.dto.response.MatchStatusUpdateVO;

public interface MatchStatusUpdateService {

    /**
     * 更新对接状态（完成 / 撤销 / 进入洽谈）。
     *
     * <p>状态机（S5-07）：
     * <ul>
     *   <li>NEGOTIATE：2(已接受) → 3(洽谈中)，双方均可</li>
     *   <li>COMPLETE：{2,3} → 5(已完成)，双方均可</li>
     *   <li>CANCEL：1(待响应) → 7(已撤销)，仅发起方；{2,3} → 7，双方均可</li>
     * </ul>
     * 其他流转返回 code:3103。
     *
     * @param recordId  对接记录 ID
     * @param accountId 操作方账号 ID（来自 Gateway X-Account-Id）
     * @param memberId  操作方会员 ID（来自 Gateway X-Member-Id）
     * @param req       请求体
     */
    MatchStatusUpdateVO update(Long recordId, Long accountId, Long memberId, MatchStatusUpdateRequest req);
}
