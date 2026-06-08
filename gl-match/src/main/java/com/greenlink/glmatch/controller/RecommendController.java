package com.greenlink.glmatch.controller;

import com.greenlink.common.result.Result;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmatch.dto.MemberBriefDTO;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import com.greenlink.glmatch.dto.response.RecommendItemVO;
import com.greenlink.glmatch.engine.score.MatchScoreResult;
import com.greenlink.glmatch.feign.MemberClient;
import com.greenlink.glmatch.feign.SupplyClient;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import com.greenlink.glmatch.service.MatchRecommendService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.CollectionUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 智能匹配推荐接口（S5-04）。
 *
 * <p>{@code GET /api/v1/match/recommendations}（需登录，Gateway 鉴权）
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/match")
@RequiredArgsConstructor
public class RecommendController {

    private static final int RECOMMEND_MAX = 200;
    private static final Set<String> VALID_SOURCE_TYPES = Set.of("RESOURCE", "DEMAND");

    private final MatchRecommendService matchRecommendService;
    private final MatchRecordMapper matchRecordMapper;
    private final SupplyClient supplyClient;
    private final MemberClient memberClient;

    /**
     * 智能匹配推荐列表（api-spec §6.2）。
     *
     * @param memberId   X-Member-Id（Gateway 注入，调用方会员 ID）
     * @param sourceType 我是资源方还是需求方（RESOURCE / DEMAND）
     * @param sourceId   我的资源 ID 或需求 ID
     * @param page       第几页（从 1 开始，默认 1）
     * @param size       每页条数（默认 10，最大 50）
     */
    @GetMapping("/recommendations")
    public Result<PageResult<RecommendItemVO>> recommendations(
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            @RequestParam String sourceType,
            @RequestParam Long sourceId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        // ── 1. 入参校验 ──
        if (memberId == null) {
            return Result.fail(1001, "未登录");
        }
        if (!VALID_SOURCE_TYPES.contains(sourceType)) {
            return Result.fail(1002, "sourceType 必须为 RESOURCE 或 DEMAND");
        }
        if (sourceId == null || sourceId <= 0) {
            return Result.fail(1002, "sourceId 无效");
        }
        if (page < 1) page = 1;
        size = Math.min(Math.max(size, 1), 50);

        // ── 2. 获取来源实体简要信息（含省份 + 归属校验）──
        SupplyBriefDTO sourceBrief = fetchSourceBrief(sourceType, sourceId);
        if (sourceBrief == null) {
            return Result.fail(3001, "资源/需求不存在");
        }
        if (!memberId.equals(sourceBrief.getMemberId())) {
            return Result.fail(1003, "无权查询该资源/需求的推荐结果");
        }
        String sourceProvince = sourceBrief.getProvince();

        // ── 3. 召回 + 打分（带缓存）──
        List<MatchScoreResult> allScored = matchRecommendService.recommend(
                sourceType, sourceId, sourceProvince, memberId, RECOMMEND_MAX);

        long total = allScored.size();
        if (total == 0) {
            return Result.ok(PageResult.of(Collections.emptyList(), 0, page, size));
        }

        // ── 4. 内存分页 ──
        int fromIdx = (page - 1) * size;
        if (fromIdx >= total) {
            return Result.ok(PageResult.of(Collections.emptyList(), total, page, size));
        }
        int toIdx = (int) Math.min(fromIdx + size, total);
        List<MatchScoreResult> pageSlice = allScored.subList(fromIdx, toIdx);

        // ── 5. 批量丰富：target 标题 + member 信息 ──
        String targetType = "RESOURCE".equals(sourceType) ? "DEMAND" : "RESOURCE";
        List<Long> targetIds = pageSlice.stream().map(MatchScoreResult::getCandidateId).toList();
        List<Long> memberIds = pageSlice.stream()
                .map(MatchScoreResult::getCandidateMemberId)
                .filter(id -> id != null)
                .distinct().toList();

        Map<Long, String> titleById = fetchTargetTitles(targetType, targetIds);
        Map<Long, MemberBriefDTO> memberById = fetchMemberBriefs(memberIds);

        // ── 6. isApplied 检查 ──
        Set<Long> appliedTargetIds = fetchAppliedIds(sourceType, sourceId, targetIds);

        // ── 7. 组装 VO ──
        List<RecommendItemVO> records = pageSlice.stream().map(scored -> {
            MemberBriefDTO member = memberById.get(scored.getCandidateMemberId());
            return RecommendItemVO.builder()
                    .targetType(targetType)
                    .targetId(scored.getCandidateId())
                    .targetTitle(titleById.getOrDefault(scored.getCandidateId(), ""))
                    .targetMember(member != null
                            ? RecommendItemVO.TargetMemberVO.builder()
                                    .id(member.getId())
                                    .name(member.getName())
                                    .memberLevel(member.getMemberLevel())
                                    .province(member.getProvince())
                                    .build()
                            : null)
                    .matchScore(scored.getTotalScore())
                    .matchReasons(scored.getMatchReasons())
                    .isApplied(appliedTargetIds.contains(scored.getCandidateId()))
                    .build();
        }).toList();

        log.debug("推荐接口返回 source={}/{} page={} size={} total={} returned={}",
                sourceType, sourceId, page, size, total, records.size());
        return Result.ok(PageResult.of(records, total, page, size));
    }

    // ───────────────────── private ─────────────────────

    private SupplyBriefDTO fetchSourceBrief(String sourceType, Long sourceId) {
        try {
            Result<SupplyBriefDTO> result = "RESOURCE".equals(sourceType)
                    ? supplyClient.getResourceMatchBrief(sourceId)
                    : supplyClient.getDemandMatchBrief(sourceId);
            return result != null ? result.getData() : null;
        } catch (Exception e) {
            log.warn("获取来源实体简要失败 sourceType={} sourceId={}", sourceType, sourceId, e);
            return null;
        }
    }

    private Map<Long, String> fetchTargetTitles(String targetType, List<Long> ids) {
        if (CollectionUtils.isEmpty(ids)) return Collections.emptyMap();
        try {
            Result<List<SupplyBriefDTO>> result = "RESOURCE".equals(targetType)
                    ? supplyClient.batchBriefResources(ids)
                    : supplyClient.batchBriefDemands(ids);
            if (result == null || result.getData() == null) return Collections.emptyMap();
            return result.getData().stream()
                    .filter(b -> b.getTitle() != null)
                    .collect(Collectors.toMap(SupplyBriefDTO::getId, SupplyBriefDTO::getTitle));
        } catch (Exception e) {
            log.warn("批量获取 target 标题失败 targetType={}", targetType, e);
            return Collections.emptyMap();
        }
    }

    private Map<Long, MemberBriefDTO> fetchMemberBriefs(List<Long> memberIds) {
        if (CollectionUtils.isEmpty(memberIds)) return Collections.emptyMap();
        try {
            Result<List<MemberBriefDTO>> result = memberClient.batchBrief(memberIds);
            if (result == null || result.getData() == null) return Collections.emptyMap();
            return result.getData().stream()
                    .collect(Collectors.toMap(MemberBriefDTO::getId, m -> m));
        } catch (Exception e) {
            log.warn("批量获取 member 简要失败 memberIds={}", memberIds, e);
            return Collections.emptyMap();
        }
    }

    private Set<Long> fetchAppliedIds(String sourceType, Long sourceId, List<Long> targetIds) {
        if (CollectionUtils.isEmpty(targetIds)) return Collections.emptySet();
        try {
            return "RESOURCE".equals(sourceType)
                    ? matchRecordMapper.findAnyMatchedDemandIds(sourceId, targetIds)
                    : matchRecordMapper.findAnyMatchedResourceIds(sourceId, targetIds);
        } catch (Exception e) {
            log.warn("查询 isApplied 失败 sourceType={} sourceId={}", sourceType, sourceId, e);
            return Collections.emptySet();
        }
    }
}
