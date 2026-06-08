package com.greenlink.glmatch.service.impl;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.MemberCompletedCount;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import com.greenlink.glmatch.engine.recall.MergedRecallCandidate;
import com.greenlink.glmatch.engine.score.MatchScoreResult;
import com.greenlink.glmatch.feign.SupplyClient;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import com.greenlink.glmatch.service.MatchScoreCalculator;
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
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 综合打分计算器实现（S5-03）。
 *
 * <p>打分维度（总满分 100）：
 * <ul>
 *   <li>行业精确匹配：40 分（命中 ≥1 个行业标签即得满分）</li>
 *   <li>标签重叠度：30 分（每命中 1 个非行业标签 +10，上限 30）</li>
 *   <li>地域相近：20 分（同省 +15；城市暂无数据故不计城市分）</li>
 *   <li>历史对接信用：10 分（每笔已完成对接 +2，上限 10）</li>
 * </ul>
 * 绿色认证加权预留（is_certified=true 总分 × 1.05），一期均为 false 不生效。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchScoreCalculatorImpl implements MatchScoreCalculator {

    private static final int INDUSTRY_FULL_SCORE = 40;
    private static final int TAG_SCORE_PER_MATCH  = 10;
    private static final int TAG_SCORE_MAX         = 30;
    private static final int GEO_SAME_PROVINCE     = 15;
    private static final int HISTORY_SCORE_PER_DEAL = 2;
    private static final int HISTORY_SCORE_MAX      = 10;
    // 绿色认证预留系数（一期不生效）
    private static final double CERT_MULTIPLIER = 1.0;

    private final MatchRecordMapper matchRecordMapper;
    private final SupplyClient supplyClient;

    @Override
    public List<MatchScoreResult> score(List<MergedRecallCandidate> candidates,
                                         String sourceBizType, Long sourceBizId,
                                         String sourceProvince, Long sourceMemberId,
                                         int topN) {
        if (CollectionUtils.isEmpty(candidates)) {
            return Collections.emptyList();
        }

        // 1. 补全 ES-only 候选缺失的省份/会员ID
        enrichMissingBriefs(candidates, "RESOURCE".equals(sourceBizType) ? "DEMAND" : "RESOURCE");

        // 2. 过滤发布方自身的候选（不向自己推荐自家资源）
        List<MergedRecallCandidate> filtered = candidates.stream()
                .filter(c -> !sourceMemberId.equals(c.getCandidateMemberId()))
                .collect(Collectors.toList());

        if (filtered.isEmpty()) {
            return Collections.emptyList();
        }

        // 3. 过滤已有活跃对接记录的候选（T5-03-2）
        filtered = filterAlreadyMatched(filtered, sourceBizType, sourceBizId);

        if (filtered.isEmpty()) {
            return Collections.emptyList();
        }

        // 4. 批量查询候选会员历史完成对接数（T5-02-1 历史维度）
        Map<Long, Integer> completedByMember = fetchCompletedCounts(filtered);

        // 5. 打分并生成原因（T5-02-2, T5-03-3）
        List<MatchScoreResult> scored = filtered.stream()
                .map(c -> computeScore(c, sourceProvince, completedByMember))
                .collect(Collectors.toList());

        // 6. 按总分降序，返回 Top-N（T5-03-1）
        scored.sort((a, b) -> Double.compare(b.getTotalScore(), a.getTotalScore()));
        if (scored.size() > topN) {
            scored = scored.subList(0, topN);
        }

        log.debug("打分完成 source={}/{} topN={} scored={} returned={}",
                sourceBizType, sourceBizId, topN, scored.size(), Math.min(scored.size(), topN));
        return scored;
    }

    // ───────────────────── private ─────────────────────

    /**
     * 补全 ES-only 候选（candidateProvince/candidateMemberId 为 null）的省份与会员 ID，
     * 通过 batch-brief Feign 接口批量获取。
     */
    private void enrichMissingBriefs(List<MergedRecallCandidate> candidates, String targetBizType) {
        List<Long> missingIds = candidates.stream()
                .filter(c -> c.getCandidateProvince() == null && c.getCandidateMemberId() == null)
                .map(MergedRecallCandidate::getCandidateId)
                .collect(Collectors.toList());

        if (missingIds.isEmpty()) return;

        try {
            Result<List<SupplyBriefDTO>> result = "RESOURCE".equals(targetBizType)
                    ? supplyClient.batchBriefResources(missingIds)
                    : supplyClient.batchBriefDemands(missingIds);
            if (result == null || result.getData() == null) return;

            Map<Long, SupplyBriefDTO> briefById = result.getData().stream()
                    .collect(Collectors.toMap(SupplyBriefDTO::getId, b -> b));

            for (MergedRecallCandidate c : candidates) {
                if (c.getCandidateProvince() == null) {
                    SupplyBriefDTO brief = briefById.get(c.getCandidateId());
                    if (brief != null) {
                        c.setCandidateProvince(brief.getProvince());
                        c.setCandidateMemberId(brief.getMemberId());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("补全候选省份信息失败 targetBizType={}", targetBizType, e);
        }
    }

    /**
     * 过滤已有活跃对接记录（status IN 1,2,3,5）的候选，避免重复推荐。
     */
    private List<MergedRecallCandidate> filterAlreadyMatched(List<MergedRecallCandidate> candidates,
                                                               String sourceBizType,
                                                               Long sourceBizId) {
        List<Long> candidateIds = candidates.stream()
                .map(MergedRecallCandidate::getCandidateId)
                .collect(Collectors.toList());

        try {
            Set<Long> matched;
            if ("RESOURCE".equals(sourceBizType)) {
                matched = matchRecordMapper.findMatchedDemandIds(sourceBizId, candidateIds);
            } else {
                matched = matchRecordMapper.findMatchedResourceIds(sourceBizId, candidateIds);
            }
            if (CollectionUtils.isEmpty(matched)) return candidates;

            return candidates.stream()
                    .filter(c -> !matched.contains(c.getCandidateId()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("查询已对接记录失败 sourceBizType={} sourceBizId={}", sourceBizType, sourceBizId, e);
            return candidates;
        }
    }

    /**
     * 批量查询候选会员的历史已完成对接次数（资源方 + 需求方合计）。
     */
    private Map<Long, Integer> fetchCompletedCounts(List<MergedRecallCandidate> candidates) {
        List<Long> memberIds = candidates.stream()
                .map(MergedRecallCandidate::getCandidateMemberId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());

        if (memberIds.isEmpty()) return Collections.emptyMap();

        Map<Long, Integer> result = new HashMap<>();
        try {
            for (MemberCompletedCount row : matchRecordMapper.countCompletedByResourceMemberIds(memberIds)) {
                result.merge(row.getMemberId(), row.getCnt(), Integer::sum);
            }
            for (MemberCompletedCount row : matchRecordMapper.countCompletedByDemandMemberIds(memberIds)) {
                result.merge(row.getMemberId(), row.getCnt(), Integer::sum);
            }
        } catch (Exception e) {
            log.warn("查询历史对接数失败", e);
        }
        return result;
    }

    /**
     * 对单个候选计算综合打分并生成 matchReasons。
     */
    private MatchScoreResult computeScore(MergedRecallCandidate c,
                                           String sourceProvince,
                                           Map<Long, Integer> completedByMember) {
        List<String> reasons = new ArrayList<>();

        // ── 行业精确匹配（40分）──
        int industryScore = 0;
        if (c.getIndustryTagMatchCount() > 0) {
            industryScore = INDUSTRY_FULL_SCORE;
            String tagName = c.getMatchedTagNames() != null && !c.getMatchedTagNames().isEmpty()
                    ? c.getMatchedTagNames().get(0) : "";
            reasons.add(StringUtils.hasText(tagName)
                    ? "行业标签高度匹配（" + tagName + "）"
                    : "行业标签高度匹配");
        }

        // ── 标签重叠度（30分）──
        int tagOverlapScore = Math.min(TAG_SCORE_MAX, c.getOtherTagMatchCount() * TAG_SCORE_PER_MATCH);
        if (tagOverlapScore > 0) {
            reasons.add("标签重叠（" + c.getOtherTagMatchCount() + "个技术/领域标签匹配）");
        }

        // ── 地域相近（同省 15分；城市数据暂缺故不计）──
        int geoScore = 0;
        if (StringUtils.hasText(sourceProvince) && sourceProvince.equals(c.getCandidateProvince())) {
            geoScore = GEO_SAME_PROVINCE;
            reasons.add("地域相近（同省）");
        }

        // ── 历史对接信用（10分）──
        int completed = completedByMember.getOrDefault(c.getCandidateMemberId(), 0);
        int historyScore = Math.min(HISTORY_SCORE_MAX, completed * HISTORY_SCORE_PER_DEAL);
        if (historyScore > 0) {
            reasons.add("成交信用良好（已完成" + completed + "次对接）");
        }

        // ── 绿色认证预留（一期 is_certified 均为 false，系数 1.0 不生效）──
        double totalScore = (industryScore + tagOverlapScore + geoScore + historyScore) * CERT_MULTIPLIER;

        return MatchScoreResult.builder()
                .candidateId(c.getCandidateId())
                .candidateMemberId(c.getCandidateMemberId())
                .candidateProvince(c.getCandidateProvince())
                .industryScore(industryScore)
                .tagOverlapScore(tagOverlapScore)
                .geoScore(geoScore)
                .historyScore(historyScore)
                .totalScore(totalScore)
                .matchedTagNames(c.getMatchedTagNames() != null ? c.getMatchedTagNames() : List.of())
                .matchReasons(reasons)
                .build();
    }
}
