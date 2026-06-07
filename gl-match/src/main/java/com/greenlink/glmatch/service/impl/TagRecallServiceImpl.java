package com.greenlink.glmatch.service.impl;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import com.greenlink.glmatch.dto.TagSimpleDTO;
import com.greenlink.glmatch.engine.recall.TagRecallCandidate;
import com.greenlink.glmatch.feign.SupplyClient;
import com.greenlink.glmatch.feign.TagClient;
import com.greenlink.glmatch.service.TagRecallService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TagRecallServiceImpl implements TagRecallService {

    private static final String INDUSTRY_CATEGORY = "INDUSTRY";

    private final TagClient tagClient;
    private final SupplyClient supplyClient;

    @Override
    public List<TagRecallCandidate> recall(String sourceBizType, Long sourceBizId,
                                            String targetBizType, String sourceProvince,
                                            int maxCandidates) {
        // 1. 获取来源实体的标签
        List<TagSimpleDTO> sourceTags = fetchTags(sourceBizType, sourceBizId);
        if (CollectionUtils.isEmpty(sourceTags)) {
            log.debug("标签召回：来源实体无标签 bizType={} bizId={}", sourceBizType, sourceBizId);
            return Collections.emptyList();
        }

        // 2. 按分类分离行业标签与其他标签
        List<TagSimpleDTO> industryTags = new ArrayList<>();
        List<TagSimpleDTO> otherTags = new ArrayList<>();
        for (TagSimpleDTO tag : sourceTags) {
            if (INDUSTRY_CATEGORY.equals(tag.getCategoryCode())) {
                industryTags.add(tag);
            } else {
                otherTags.add(tag);
            }
        }

        // 3. 批量查询目标侧的 tagId → bizIds 映射
        List<Long> allTagIds = sourceTags.stream().map(TagSimpleDTO::getId).toList();
        Map<Long, List<Long>> tagIdToBizIds = fetchBizIdsBatch(allTagIds, targetBizType);

        // 4. 构建候选评分表（candidateId → CandidateScore）
        Map<Long, CandidateScore> scoreMap = buildScoreMap(industryTags, otherTags, tagIdToBizIds, sourceTags);

        if (scoreMap.isEmpty()) {
            log.debug("标签召回：无候选结果 sourceBizType={} sourceBizId={} targetBizType={}",
                    sourceBizType, sourceBizId, targetBizType);
            return Collections.emptyList();
        }

        // 5. 应用 must 约束：若来源有行业标签，候选必须至少命中 1 个行业标签
        if (!industryTags.isEmpty()) {
            scoreMap.entrySet().removeIf(e -> e.getValue().industryCount == 0);
        }

        // 6. 排序：tagScore 降序，取前 maxCandidates × 3（留余量供省份过滤）
        int fetchSize = StringUtils.hasText(sourceProvince) ? maxCandidates * 3 : maxCandidates;
        List<Map.Entry<Long, CandidateScore>> sorted = scoreMap.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue().totalScore(), a.getValue().totalScore()))
                .limit(fetchSize)
                .toList();

        // 7. 省份过滤（filter 语义）
        if (StringUtils.hasText(sourceProvince)) {
            return applyProvinceFilter(sorted, targetBizType, sourceProvince, maxCandidates);
        }

        // 8. 构建结果，无省份过滤直接返回
        return sorted.stream()
                .map(e -> buildCandidate(e.getKey(), null, null, e.getValue()))
                .limit(maxCandidates)
                .toList();
    }

    // ───────────────────── private helpers ─────────────────────

    private List<TagSimpleDTO> fetchTags(String bizType, Long bizId) {
        try {
            Result<List<TagSimpleDTO>> result = tagClient.getByBiz(bizType, bizId);
            return result != null && result.getData() != null ? result.getData() : Collections.emptyList();
        } catch (Exception e) {
            log.warn("获取标签失败 bizType={} bizId={}", bizType, bizId, e);
            return Collections.emptyList();
        }
    }

    private Map<Long, List<Long>> fetchBizIdsBatch(List<Long> tagIds, String bizType) {
        if (CollectionUtils.isEmpty(tagIds)) return Collections.emptyMap();
        try {
            Result<Map<Long, List<Long>>> result = tagClient.getBizIdsByTagsBatch(tagIds, bizType);
            return result != null && result.getData() != null ? result.getData() : Collections.emptyMap();
        } catch (Exception e) {
            log.warn("批量查询 bizIds 失败 tagIds={} bizType={}", tagIds, bizType, e);
            return Collections.emptyMap();
        }
    }

    /**
     * 遍历行业标签与其他标签，为每个候选 ID 累计 industryCount 和 otherCount，
     * 并记录命中的标签 ID 和名称。
     */
    private Map<Long, CandidateScore> buildScoreMap(List<TagSimpleDTO> industryTags,
                                                      List<TagSimpleDTO> otherTags,
                                                      Map<Long, List<Long>> tagIdToBizIds,
                                                      List<TagSimpleDTO> allTags) {
        // tagId → TagSimpleDTO 反查（用于记录命中标签名称）
        Map<Long, TagSimpleDTO> tagById = allTags.stream()
                .collect(Collectors.toMap(TagSimpleDTO::getId, t -> t));

        Map<Long, CandidateScore> scoreMap = new HashMap<>();

        for (TagSimpleDTO tag : industryTags) {
            List<Long> bizIds = tagIdToBizIds.getOrDefault(tag.getId(), Collections.emptyList());
            for (Long bizId : bizIds) {
                scoreMap.computeIfAbsent(bizId, k -> new CandidateScore()).addIndustry(tag.getId(), tag.getName());
            }
        }
        for (TagSimpleDTO tag : otherTags) {
            List<Long> bizIds = tagIdToBizIds.getOrDefault(tag.getId(), Collections.emptyList());
            for (Long bizId : bizIds) {
                scoreMap.computeIfAbsent(bizId, k -> new CandidateScore()).addOther(tag.getId(), tag.getName());
            }
        }
        return scoreMap;
    }

    /**
     * 批量获取候选实体省份，按 sourceProvince 过滤，返回最终候选列表。
     */
    private List<TagRecallCandidate> applyProvinceFilter(List<Map.Entry<Long, CandidateScore>> sorted,
                                                           String targetBizType,
                                                           String sourceProvince,
                                                           int maxCandidates) {
        List<Long> candidateIds = sorted.stream().map(Map.Entry::getKey).toList();

        // 批量拉取候选简要信息（省份、会员ID 等）
        List<SupplyBriefDTO> briefs = fetchBriefs(targetBizType, candidateIds);
        Map<Long, SupplyBriefDTO> briefById = briefs.stream()
                .collect(Collectors.toMap(SupplyBriefDTO::getId, b -> b));

        // 构建候选列表：仅保留同省候选
        List<TagRecallCandidate> results = new ArrayList<>();
        for (Map.Entry<Long, CandidateScore> entry : sorted) {
            if (results.size() >= maxCandidates) break;
            Long candidateId = entry.getKey();
            SupplyBriefDTO brief = briefById.get(candidateId);
            if (brief == null) continue;
            // filter 省份：仅保留与来源同省的候选
            if (!sourceProvince.equals(brief.getProvince())) continue;
            results.add(buildCandidate(candidateId, brief.getMemberId(), brief.getProvince(), entry.getValue()));
        }
        return results;
    }

    private List<SupplyBriefDTO> fetchBriefs(String bizType, List<Long> ids) {
        if (CollectionUtils.isEmpty(ids)) return Collections.emptyList();
        try {
            Result<List<SupplyBriefDTO>> result = "RESOURCE".equals(bizType)
                    ? supplyClient.batchBriefResources(ids)
                    : supplyClient.batchBriefDemands(ids);
            return result != null && result.getData() != null ? result.getData() : Collections.emptyList();
        } catch (Exception e) {
            log.warn("批量查询供需简要信息失败 bizType={}", bizType, e);
            return Collections.emptyList();
        }
    }

    private TagRecallCandidate buildCandidate(Long candidateId, Long memberId, String province,
                                               CandidateScore score) {
        return TagRecallCandidate.builder()
                .candidateId(candidateId)
                .candidateMemberId(memberId)
                .candidateProvince(province)
                .industryTagMatchCount(score.industryCount)
                .otherTagMatchCount(score.otherCount)
                .tagScore(score.totalScore())
                .matchedTagIds(new ArrayList<>(score.matchedTagIds))
                .matchedTagNames(new ArrayList<>(score.matchedTagNames))
                .build();
    }

    /** 候选得分累计器（内部状态类） */
    private static class CandidateScore {
        int industryCount = 0;
        int otherCount = 0;
        final List<Long> matchedTagIds = new ArrayList<>();
        final List<String> matchedTagNames = new ArrayList<>();

        void addIndustry(Long tagId, String tagName) {
            industryCount++;
            matchedTagIds.add(tagId);
            matchedTagNames.add(tagName);
        }

        void addOther(Long tagId, String tagName) {
            otherCount++;
            matchedTagIds.add(tagId);
            matchedTagNames.add(tagName);
        }

        int totalScore() {
            return industryCount * 2 + otherCount;
        }
    }
}
