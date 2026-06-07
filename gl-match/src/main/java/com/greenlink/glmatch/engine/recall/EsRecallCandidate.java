package com.greenlink.glmatch.engine.recall;

/**
 * ES MLT 召回阶段的候选项，携带 BM25 相关性得分。
 */
public record EsRecallCandidate(Long candidateId, float esScore) {
}
