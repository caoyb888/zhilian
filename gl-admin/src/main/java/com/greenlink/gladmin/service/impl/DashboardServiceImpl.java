package com.greenlink.gladmin.service.impl;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.AuditSummaryVO;
import com.greenlink.gladmin.dto.response.DashboardOverviewVO;
import com.greenlink.gladmin.dto.response.MatchStatsDTO;
import com.greenlink.gladmin.dto.response.MemberStatsDTO;
import com.greenlink.gladmin.dto.response.SupplyStatsDTO;
import com.greenlink.gladmin.feign.MatchClient;
import com.greenlink.gladmin.feign.MemberClient;
import com.greenlink.gladmin.feign.SupplyClient;
import com.greenlink.gladmin.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final MemberClient memberClient;
    private final SupplyClient supplyClient;
    private final MatchClient matchClient;

    @Override
    public DashboardOverviewVO getOverview() {
        MemberStatsDTO memberStats = fetchMemberStats();
        SupplyStatsDTO supplyStats = fetchSupplyStats();
        MatchStatsDTO matchStats = fetchMatchStats();

        DashboardOverviewVO vo = new DashboardOverviewVO();
        vo.setTotalMembers(memberStats.getTotalMembers());
        vo.setNewMembersThisMonth(memberStats.getNewMembersThisMonth());
        vo.setPendingAuditCount(supplyStats.getTotalPendingAudit());
        vo.setTotalMatchCount(matchStats.getTotalMatchCount());
        vo.setMatchSuccessRate(
                matchStats.getSuccessRate() != null ? matchStats.getSuccessRate() : BigDecimal.ZERO);
        return vo;
    }

    @Override
    public AuditSummaryVO getAuditSummary() {
        try {
            Result<AuditSummaryVO> result = supplyClient.getAuditSummary();
            if (result != null && result.getCode() == 0 && result.getData() != null) {
                return result.getData();
            }
        } catch (Exception e) {
            log.error("获取供需审核汇总失败", e);
        }
        AuditSummaryVO fallback = new AuditSummaryVO();
        fallback.setLast7DaysAudit(new java.util.ArrayList<>());
        return fallback;
    }

    private MemberStatsDTO fetchMemberStats() {
        try {
            Result<MemberStatsDTO> result = memberClient.getStats();
            if (result != null && result.getCode() == 0 && result.getData() != null) {
                return result.getData();
            }
        } catch (Exception e) {
            log.error("获取会员统计失败", e);
        }
        return new MemberStatsDTO();
    }

    private SupplyStatsDTO fetchSupplyStats() {
        try {
            Result<SupplyStatsDTO> result = supplyClient.getStats();
            if (result != null && result.getCode() == 0 && result.getData() != null) {
                return result.getData();
            }
        } catch (Exception e) {
            log.error("获取供需统计失败", e);
        }
        return new SupplyStatsDTO();
    }

    private MatchStatsDTO fetchMatchStats() {
        try {
            Result<MatchStatsDTO> result = matchClient.getStats();
            if (result != null && result.getCode() == 0 && result.getData() != null) {
                return result.getData();
            }
        } catch (Exception e) {
            log.error("获取对接统计失败", e);
        }
        MatchStatsDTO dto = new MatchStatsDTO();
        dto.setSuccessRate(BigDecimal.ZERO);
        return dto;
    }
}
