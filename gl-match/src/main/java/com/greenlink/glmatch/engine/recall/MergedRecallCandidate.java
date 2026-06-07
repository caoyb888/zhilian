package com.greenlink.glmatch.engine.recall;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 双路召回合并后的候选项，同时携带标签召回与 ES 召回信息，供 S5-03 综合打分使用。
 */
@Data
@Builder
public class MergedRecallCandidate {

    private Long candidateId;
    private Long candidateMemberId;
    private String candidateProvince;

    // ── 来源标记 ──
    private boolean fromTagRecall;
    private boolean fromEsRecall;

    // ── 标签召回维度（来自 TagRecallCandidate） ──
    private int industryTagMatchCount;
    private int otherTagMatchCount;
    private int tagScore;
    private List<Long> matchedTagIds;
    private List<String> matchedTagNames;

    // ── ES 召回维度（来自 EsRecallCandidate） ──
    /** BM25 原始得分（0 表示未命中 ES 召回） */
    private float esScore;
    /** BM25 归一化得分 [0,1]，按批次内最高分归一化后填充 */
    private float esScoreNormalized;
}
