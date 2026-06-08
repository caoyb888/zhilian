package com.greenlink.glmatch.service;

import com.greenlink.glmatch.engine.recall.MergedRecallCandidate;
import com.greenlink.glmatch.engine.score.MatchScoreResult;

import java.util.List;

/**
 * 综合打分计算器（S5-03）。
 *
 * <p>职责：
 * <ol>
 *   <li>补全候选缺失的省份/会员信息（ES-only 候选无省份）</li>
 *   <li>过滤发布方自身的候选</li>
 *   <li>过滤已有活跃对接记录的候选（T5-03-2）</li>
 *   <li>按行业40 + 标签30 + 地域20 + 历史10 打分（T5-02-1）</li>
 *   <li>绿色认证预留系数（一期恒为 1.0，T5-02-3）</li>
 *   <li>生成 matchReasons 解释数组（T5-03-3）</li>
 *   <li>按 totalScore 降序返回 Top-N（T5-03-1）</li>
 * </ol>
 */
public interface MatchScoreCalculator {

    /**
     * @param candidates     双路召回合并后的候选集（来自 MergedRecallService）
     * @param sourceBizType  来源业务类型（RESOURCE 或 DEMAND）
     * @param sourceBizId    来源业务 ID
     * @param sourceProvince 来源省份（null 则不计地域分）
     * @param sourceMemberId 发布方会员 ID（过滤自家候选）
     * @param topN           返回最多条数
     * @return 按 totalScore 降序的打分结果列表
     */
    List<MatchScoreResult> score(List<MergedRecallCandidate> candidates,
                                  String sourceBizType, Long sourceBizId,
                                  String sourceProvince, Long sourceMemberId,
                                  int topN);
}
