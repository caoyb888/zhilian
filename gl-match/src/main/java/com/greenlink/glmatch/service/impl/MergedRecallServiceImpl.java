package com.greenlink.glmatch.service.impl;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import com.greenlink.glmatch.engine.recall.EsRecallCandidate;
import com.greenlink.glmatch.engine.recall.MergedRecallCandidate;
import com.greenlink.glmatch.engine.recall.TagRecallCandidate;
import com.greenlink.glmatch.feign.SupplyClient;
import com.greenlink.glmatch.service.EsRecallService;
import com.greenlink.glmatch.service.MergedRecallService;
import com.greenlink.glmatch.service.TagRecallService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MergedRecallServiceImpl implements MergedRecallService {

    private final TagRecallService tagRecallService;
    private final EsRecallService esRecallService;
    private final SupplyClient supplyClient;

    @Override
    public List<MergedRecallCandidate> recall(String sourceBizType, Long sourceBizId,
                                               String targetBizType, String sourceProvince,
                                               int maxCandidates) {
        // 1. 标签召回（已含省份过滤）
        List<TagRecallCandidate> tagCandidates = tagRecallService.recall(
                sourceBizType, sourceBizId, targetBizType, sourceProvince, maxCandidates * 2);

        // 2. 获取来源实体的 title+summary 用于 MLT
        String likeText = fetchSourceLikeText(sourceBizType, sourceBizId);

        // 3. ES MLT 召回（省份过滤作为 ES filter 子句，直接在 ES 侧剪枝）
        List<EsRecallCandidate> esCandidates = esRecallService.recall(
                likeText, targetBizType, sourceProvince, maxCandidates * 2);

        // 4. 合并去重
        List<MergedRecallCandidate> merged = merge(tagCandidates, esCandidates);

        // 5. 排序 + 截取 Top-maxCandidates
        merged.sort(MergedRecallServiceImpl::compareByTier);
        if (merged.size() > maxCandidates) {
            merged = merged.subList(0, maxCandidates);
        }

        log.debug("双路召回完成 source={}/{} target={} tag={} es={} merged={}",
                sourceBizType, sourceBizId, targetBizType,
                tagCandidates.size(), esCandidates.size(), merged.size());
        return merged;
    }

    // ───────────────────── private ─────────────────────

    private String fetchSourceLikeText(String bizType, Long bizId) {
        try {
            Result<SupplyBriefDTO> result = "RESOURCE".equals(bizType)
                    ? supplyClient.getResourceMatchBrief(bizId)
                    : supplyClient.getDemandMatchBrief(bizId);
            if (result == null || result.getData() == null) return "";
            SupplyBriefDTO brief = result.getData();
            StringBuilder sb = new StringBuilder();
            if (StringUtils.hasText(brief.getTitle())) sb.append(brief.getTitle());
            if (StringUtils.hasText(brief.getSummary())) sb.append(" ").append(brief.getSummary());
            return sb.toString().trim();
        } catch (Exception e) {
            log.warn("获取来源实体文本失败 bizType={} bizId={}", bizType, bizId, e);
            return "";
        }
    }

    /**
     * 合并两路候选：以 candidateId 为 key，同时命中两路的记录合并字段，
     * 并对 ES 分数在批次内做最大值归一化。
     */
    private List<MergedRecallCandidate> merge(List<TagRecallCandidate> tagCandidates,
                                               List<EsRecallCandidate> esCandidates) {
        // tagId → TagRecallCandidate
        Map<Long, TagRecallCandidate> tagMap = new HashMap<>();
        for (TagRecallCandidate t : tagCandidates) {
            tagMap.put(t.getCandidateId(), t);
        }

        // esId → EsRecallCandidate + 计算最大 ES 分
        Map<Long, EsRecallCandidate> esMap = new HashMap<>();
        float maxEsScore = 0f;
        for (EsRecallCandidate e : esCandidates) {
            esMap.put(e.candidateId(), e);
            if (e.esScore() > maxEsScore) maxEsScore = e.esScore();
        }
        final float maxScore = maxEsScore;

        // 构建合并结果
        Map<Long, MergedRecallCandidate> mergedMap = new HashMap<>();

        // 来自标签召回的候选
        for (TagRecallCandidate t : tagCandidates) {
            EsRecallCandidate es = esMap.get(t.getCandidateId());
            float esScore = es != null ? es.esScore() : 0f;
            float esNorm = maxScore > 0 ? esScore / maxScore : 0f;
            mergedMap.put(t.getCandidateId(), MergedRecallCandidate.builder()
                    .candidateId(t.getCandidateId())
                    .candidateMemberId(t.getCandidateMemberId())
                    .candidateProvince(t.getCandidateProvince())
                    .fromTagRecall(true)
                    .fromEsRecall(es != null)
                    .industryTagMatchCount(t.getIndustryTagMatchCount())
                    .otherTagMatchCount(t.getOtherTagMatchCount())
                    .tagScore(t.getTagScore())
                    .matchedTagIds(t.getMatchedTagIds() != null ? t.getMatchedTagIds() : List.of())
                    .matchedTagNames(t.getMatchedTagNames() != null ? t.getMatchedTagNames() : List.of())
                    .esScore(esScore)
                    .esScoreNormalized(esNorm)
                    .build());
        }

        // 仅来自 ES 召回（标签未命中）的候选
        for (EsRecallCandidate es : esCandidates) {
            if (!mergedMap.containsKey(es.candidateId())) {
                float esNorm = maxScore > 0 ? es.esScore() / maxScore : 0f;
                mergedMap.put(es.candidateId(), MergedRecallCandidate.builder()
                        .candidateId(es.candidateId())
                        .fromTagRecall(false)
                        .fromEsRecall(true)
                        .industryTagMatchCount(0)
                        .otherTagMatchCount(0)
                        .tagScore(0)
                        .matchedTagIds(Collections.emptyList())
                        .matchedTagNames(Collections.emptyList())
                        .esScore(es.esScore())
                        .esScoreNormalized(esNorm)
                        .build());
            }
        }

        return new ArrayList<>(mergedMap.values());
    }

    /**
     * 三级排序：
     * <ol>
     *   <li>两路都命中 > 仅标签 > 仅 ES</li>
     *   <li>同级内：tagScore × 2 + esScoreNormalized × 100 降序</li>
     * </ol>
     */
    private static int compareByTier(MergedRecallCandidate a, MergedRecallCandidate b) {
        int tierA = tier(a);
        int tierB = tier(b);
        if (tierA != tierB) return tierA - tierB; // 小 tier 值 = 更高优先
        // 同级内按综合分降序
        double scoreA = a.getTagScore() * 2.0 + a.getEsScoreNormalized() * 100;
        double scoreB = b.getTagScore() * 2.0 + b.getEsScoreNormalized() * 100;
        return Double.compare(scoreB, scoreA);
    }

    private static int tier(MergedRecallCandidate c) {
        if (c.isFromTagRecall() && c.isFromEsRecall()) return 1;
        if (c.isFromTagRecall()) return 2;
        return 3;
    }
}
