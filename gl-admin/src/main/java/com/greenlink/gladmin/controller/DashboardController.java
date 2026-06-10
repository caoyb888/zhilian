package com.greenlink.gladmin.controller;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.AuditSummaryVO;
import com.greenlink.gladmin.dto.response.DashboardOverviewVO;
import com.greenlink.gladmin.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理端数据看板聚合接口（S7-01）。
 * Gateway 路由 /api/v1/admin/** → gl-admin。
 * 接口本身不做业务鉴权，由 Gateway 统一校验管理员 token。
 */
@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * 获取 5 个核心看板指标。
     *
     * <pre>
     * GET /api/v1/admin/dashboard/overview
     * 响应：
     * {
     *   "totalMembers": 120,
     *   "newMembersThisMonth": 8,
     *   "pendingAuditCount": 15,
     *   "totalMatchCount": 340,
     *   "matchSuccessRate": 42.35
     * }
     * </pre>
     */
    @GetMapping("/overview")
    public Result<DashboardOverviewVO> overview() {
        return Result.ok(dashboardService.getOverview());
    }

    /**
     * 供需审核汇总（S7-02）。
     *
     * <pre>
     * GET /api/v1/admin/dashboard/audit-summary
     * 响应：
     * {
     *   "pendingResourceCount": 10,
     *   "pendingDemandCount": 5,
     *   "totalPendingAudit": 15,
     *   "last7DaysAudit": [
     *     {"date": "2026-06-05", "auditedCount": 3},
     *     ...共 7 条，升序
     *   ]
     * }
     * </pre>
     */
    @GetMapping("/audit-summary")
    public Result<AuditSummaryVO> auditSummary() {
        return Result.ok(dashboardService.getAuditSummary());
    }
}
