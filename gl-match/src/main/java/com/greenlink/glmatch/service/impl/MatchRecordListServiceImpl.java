package com.greenlink.glmatch.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.result.Result;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmatch.domain.MatchRecord;
import com.greenlink.glmatch.dto.MemberBriefDTO;
import com.greenlink.glmatch.dto.MatchUnreadCount;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import com.greenlink.glmatch.dto.response.MatchRecordItemVO;
import com.greenlink.glmatch.feign.MemberClient;
import com.greenlink.glmatch.feign.SupplyClient;
import com.greenlink.glmatch.repository.MatchMessageMapper;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import com.greenlink.glmatch.service.MatchRecordListService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchRecordListServiceImpl implements MatchRecordListService {

    private final MatchRecordMapper matchRecordMapper;
    private final MatchMessageMapper matchMessageMapper;
    private final SupplyClient supplyClient;
    private final MemberClient memberClient;

    @Override
    public PageResult<MatchRecordItemVO> listMyRecords(Long accountId, Long memberId,
                                                        Integer status, int page, int size) {
        // ── 1. 双向分页查询 ──
        QueryWrapper<MatchRecord> wrapper = new QueryWrapper<MatchRecord>()
                .select("id", "resource_id", "demand_id", "resource_member_id", "demand_member_id",
                        "match_score", "match_type", "status", "initiator_id", "apply_message",
                        "created_at", "updated_at")
                .and(w -> w.eq("resource_member_id", memberId)
                            .or()
                            .eq("demand_member_id", memberId))
                .eq(status != null, "status", status)
                .orderByDesc("updated_at");

        IPage<MatchRecord> dbPage = matchRecordMapper.selectPage(new Page<>(page, size), wrapper);
        List<MatchRecord> records = dbPage.getRecords();

        if (records.isEmpty()) {
            return PageResult.of(Collections.emptyList(), 0, page, size);
        }

        // ── 2. 批量丰富：标题、对方会员、未读数 ──
        List<Long> recordIds    = records.stream().map(MatchRecord::getId).toList();
        List<Long> resourceIds  = records.stream().map(MatchRecord::getResourceId).distinct().toList();
        List<Long> demandIds    = records.stream().map(MatchRecord::getDemandId).distinct().toList();

        // 对方会员 ID：资源方或需求方中不是 memberId 的那一侧
        List<Long> counterpartyMemberIds = records.stream()
                .map(r -> memberId.equals(r.getResourceMemberId())
                        ? r.getDemandMemberId()
                        : r.getResourceMemberId())
                .distinct().toList();

        Map<Long, String>        resourceTitles  = fetchTitles("RESOURCE", resourceIds);
        Map<Long, String>        demandTitles    = fetchTitles("DEMAND", demandIds);
        Map<Long, MemberBriefDTO> memberBriefs   = fetchMemberBriefs(counterpartyMemberIds);
        Map<Long, Integer>        unreadCounts   = fetchUnreadCounts(accountId, recordIds);

        // ── 3. 组装 VO ──
        List<MatchRecordItemVO> vos = records.stream().map(r -> {
            Long counterpartyMemberId = memberId.equals(r.getResourceMemberId())
                    ? r.getDemandMemberId()
                    : r.getResourceMemberId();
            MemberBriefDTO counterparty = memberBriefs.get(counterpartyMemberId);

            return MatchRecordItemVO.builder()
                    .recordId(r.getId())
                    .resourceId(r.getResourceId())
                    .demandId(r.getDemandId())
                    .resourceTitle(resourceTitles.getOrDefault(r.getResourceId(), ""))
                    .demandTitle(demandTitles.getOrDefault(r.getDemandId(), ""))
                    .counterparty(counterparty != null
                            ? MatchRecordItemVO.CounterpartyVO.builder()
                                    .memberId(counterparty.getId())
                                    .name(counterparty.getName())
                                    .memberLevel(counterparty.getMemberLevel())
                                    .province(counterparty.getProvince())
                                    .build()
                            : null)
                    .matchScore(r.getMatchScore())
                    .matchType(r.getMatchType())
                    .status(r.getStatus())
                    .applyMessage(r.getApplyMessage())
                    .isInitiator(accountId.equals(r.getInitiatorId()))
                    .unreadCount(unreadCounts.getOrDefault(r.getId(), 0))
                    .createdAt(r.getCreatedAt())
                    .updatedAt(r.getUpdatedAt())
                    .build();
        }).toList();

        return PageResult.of(vos, dbPage.getTotal(), page, size);
    }

    // ──────────────── private helpers ────────────────

    private Map<Long, String> fetchTitles(String type, List<Long> ids) {
        if (CollectionUtils.isEmpty(ids)) return Collections.emptyMap();
        try {
            Result<List<SupplyBriefDTO>> result = "RESOURCE".equals(type)
                    ? supplyClient.batchBriefResources(ids)
                    : supplyClient.batchBriefDemands(ids);
            if (result == null || result.getData() == null) return Collections.emptyMap();
            return result.getData().stream()
                    .filter(b -> b.getTitle() != null)
                    .collect(Collectors.toMap(SupplyBriefDTO::getId, SupplyBriefDTO::getTitle));
        } catch (Exception e) {
            log.warn("批量获取 {} 标题失败", type, e);
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
            log.warn("批量获取会员简要失败 memberIds={}", memberIds, e);
            return Collections.emptyMap();
        }
    }

    private Map<Long, Integer> fetchUnreadCounts(Long accountId, List<Long> matchIds) {
        if (CollectionUtils.isEmpty(matchIds)) return Collections.emptyMap();
        try {
            List<MatchUnreadCount> counts =
                    matchMessageMapper.countUnreadByMatchIds(accountId, matchIds);
            return counts.stream()
                    .collect(Collectors.toMap(MatchUnreadCount::getMatchId, MatchUnreadCount::getCnt));
        } catch (Exception e) {
            log.warn("查询未读数失败 accountId={}", accountId, e);
            return Collections.emptyMap();
        }
    }
}
