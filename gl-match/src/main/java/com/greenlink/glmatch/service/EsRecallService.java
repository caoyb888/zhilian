package com.greenlink.glmatch.service;

import com.greenlink.glmatch.engine.recall.EsRecallCandidate;

import java.util.List;

public interface EsRecallService {

    /**
     * 基于 more_like_this 的 ES 全文相似召回（BM25）。
     *
     * @param likeText       来源实体的 title + summary（MLT 相似文本）
     * @param targetBizType  目标业务类型（RESOURCE 或 DEMAND）
     * @param provinceFilter 省份过滤（非空时添加 ES filter 子句）
     * @param maxResults     最大召回数
     * @return 按 BM25 得分降序排列的候选列表
     */
    List<EsRecallCandidate> recall(String likeText, String targetBizType,
                                    String provinceFilter, int maxResults);
}
