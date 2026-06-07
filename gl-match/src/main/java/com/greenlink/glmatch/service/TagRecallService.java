package com.greenlink.glmatch.service;

import com.greenlink.glmatch.engine.recall.TagRecallCandidate;

import java.util.List;

public interface TagRecallService {

    /**
     * 基于 tag_relation 的标签精确召回。
     *
     * <p>布尔查询语义：
     * <ul>
     *   <li>must：候选必须命中至少 1 个 INDUSTRY 行业标签（若来源无行业标签则放宽为无 must 约束）</li>
     *   <li>should：候选命中的技术域/类型标签越多，tagScore 越高</li>
     *   <li>filter：若 sourceProvince 不为空，则仅保留同省候选</li>
     * </ul>
     *
     * @param sourceBizType  来源业务类型 (RESOURCE 或 DEMAND)
     * @param sourceBizId    来源业务 ID
     * @param targetBizType  目标业务类型（与来源相反：DEMAND 或 RESOURCE）
     * @param sourceProvince 来源省份；非空时过滤同省候选
     * @param maxCandidates  最大返回候选数（建议 200）
     * @return 按 tagScore 降序排列的候选列表
     */
    List<TagRecallCandidate> recall(String sourceBizType, Long sourceBizId,
                                     String targetBizType, String sourceProvince,
                                     int maxCandidates);
}
