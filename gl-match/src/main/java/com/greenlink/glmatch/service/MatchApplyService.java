package com.greenlink.glmatch.service;

import com.greenlink.glmatch.dto.request.BatchMatchApplyRequest;
import com.greenlink.glmatch.dto.request.MatchApplyRequest;
import com.greenlink.glmatch.dto.response.BatchMatchApplyVO;
import com.greenlink.glmatch.dto.response.MatchApplyVO;

public interface MatchApplyService {

    /**
     * 发起对接申请。
     *
     * <p>校验顺序：资源/需求存在 → 调用方归属校验 → 自对接防护 → 重复对接防护（3102）→ 创建 match_record。
     *
     * @param accountId 发起方账号 ID（来自 Gateway X-Account-Id）
     * @param memberId  发起方会员 ID（来自 Gateway X-Member-Id）
     * @param req       申请请求体
     * @return 新建的对接记录摘要
     */
    MatchApplyVO apply(Long accountId, Long memberId, MatchApplyRequest req);

    /**
     * 批量发起对接申请（UAT#13，1 对 N）。允许部分成功，逐条返回失败原因。
     */
    BatchMatchApplyVO batchApply(Long accountId, Long memberId, BatchMatchApplyRequest req);
}
