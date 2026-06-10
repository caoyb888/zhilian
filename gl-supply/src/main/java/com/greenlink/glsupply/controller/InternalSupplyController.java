package com.greenlink.glsupply.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.greenlink.common.result.Result;
import com.greenlink.glsupply.domain.SupplyDemand;
import com.greenlink.glsupply.domain.SupplyResource;
import com.greenlink.glsupply.dto.response.AuditDailyVO;
import com.greenlink.glsupply.dto.response.SupplyAuditSummaryVO;
import com.greenlink.glsupply.dto.response.SupplyStatsVO;
import com.greenlink.glsupply.enums.AuditStatus;
import com.greenlink.glsupply.repository.SupplyDemandMapper;
import com.greenlink.glsupply.repository.SupplyResourceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/supply/internal")
@RequiredArgsConstructor
public class InternalSupplyController {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final SupplyResourceMapper resourceMapper;
    private final SupplyDemandMapper demandMapper;

    /** 内部统计：待审核资源数 + 待审核需求数，供 gl-admin 看板 Feign 调用（S7-01） */
    @GetMapping("/stats")
    public Result<SupplyStatsVO> stats() {
        long pendingResource = resourceMapper.selectCount(
                new QueryWrapper<SupplyResource>().eq("audit_status", AuditStatus.PENDING.getCode()));
        long pendingDemand = demandMapper.selectCount(
                new QueryWrapper<SupplyDemand>().eq("audit_status", AuditStatus.PENDING.getCode()));

        SupplyStatsVO vo = new SupplyStatsVO();
        vo.setPendingResourceCount(pendingResource);
        vo.setPendingDemandCount(pendingDemand);
        vo.setTotalPendingAudit(pendingResource + pendingDemand);
        return Result.ok(vo);
    }

    /**
     * 内部审核汇总（S7-02）：待审核数量 + 近7日逐日审核量。
     * 供 gl-admin BFF Feign 调用，无需鉴权。
     */
    @GetMapping("/audit-summary")
    public Result<SupplyAuditSummaryVO> auditSummary() {
        long pendingResource = resourceMapper.selectCount(
                new QueryWrapper<SupplyResource>().eq("audit_status", AuditStatus.PENDING.getCode()));
        long pendingDemand = demandMapper.selectCount(
                new QueryWrapper<SupplyDemand>().eq("audit_status", AuditStatus.PENDING.getCode()));

        LocalDate today = LocalDate.now();
        LocalDate startDay = today.minusDays(6);
        String startDate = startDay.format(DATE_FMT);
        String endDate   = today.format(DATE_FMT);

        // 合并资源与需求的逐日审核量
        Map<String, Long> dailyMap = new HashMap<>();
        toCountMap(resourceMapper.countAuditedByDay(startDate, endDate), dailyMap);
        toCountMap(demandMapper.countAuditedByDay(startDate, endDate), dailyMap);

        // 填充7天（无数据的日期补0，保持升序）
        List<AuditDailyVO> last7Days = new ArrayList<>(7);
        for (int i = 6; i >= 0; i--) {
            String d = today.minusDays(i).format(DATE_FMT);
            last7Days.add(new AuditDailyVO(d, dailyMap.getOrDefault(d, 0L)));
        }

        SupplyAuditSummaryVO vo = new SupplyAuditSummaryVO();
        vo.setPendingResourceCount(pendingResource);
        vo.setPendingDemandCount(pendingDemand);
        vo.setTotalPendingAudit(pendingResource + pendingDemand);
        vo.setLast7DaysAudit(last7Days);
        return Result.ok(vo);
    }

    private void toCountMap(List<Map<String, Object>> rows, Map<String, Long> target) {
        for (Map<String, Object> row : rows) {
            String date = (String) row.get("auditDate");
            Number cnt  = (Number) row.get("cnt");
            if (date != null && cnt != null) {
                target.merge(date, cnt.longValue(), Long::sum);
            }
        }
    }
}
