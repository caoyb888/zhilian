package com.greenlink.glmatch.service;

import com.greenlink.glmatch.engine.recall.MergedRecallCandidate;

import java.util.List;

public interface MergedRecallService {

    /**
     * 双路召回：标签精确召回 + ES 全文相似召回，合并去重后返回 Top-N 候选。
     *
     * <p>合并排序规则（三级优先）：
     * <ol>
     *   <li>同时命中标签与 ES 两路 → 最高置信度，优先</li>
     *   <li>仅命中标签召回（满足 must 行业标签约束）→ 次之</li>
     *   <li>仅命中 ES 召回 → 兜底，补充语义相似内容</li>
     * </ol>
     *
     * @param sourceBizType  来源业务类型（RESOURCE 或 DEMAND）
     * @param sourceBizId    来源业务 ID
     * @param targetBizType  目标业务类型（与来源相反）
     * @param sourceProvince 来源省份；非空时同时作用于标签召回与 ES filter
     * @param maxCandidates  最大候选数（默认 200）
     * @return 合并去重并按置信度降序排列的候选列表
     */
    List<MergedRecallCandidate> recall(String sourceBizType, Long sourceBizId,
                                        String targetBizType, String sourceProvince,
                                        int maxCandidates);
}
