package com.greenlink.glmatch.service;

import com.greenlink.glmatch.engine.score.MatchScoreResult;

import java.util.List;

/**
 * 匹配推荐服务（S5-03）：编排双路召回 → 综合打分 → Redis 缓存（5min）。
 * S5-04 的 RecommendController 直接调用此接口。
 */
public interface MatchRecommendService {

    /**
     * @param sourceBizType  来源业务类型（RESOURCE 或 DEMAND）
     * @param sourceBizId    来源业务 ID
     * @param sourceProvince 来源省份（可为 null）
     * @param sourceMemberId 发布方会员 ID
     * @param topN           最多返回条数
     * @return 按 totalScore 降序的推荐列表
     */
    List<MatchScoreResult> recommend(String sourceBizType, Long sourceBizId,
                                      String sourceProvince, Long sourceMemberId,
                                      int topN);
}
