package com.greenlink.gladmin.dto.response;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 管理端数据看板核心指标聚合 VO（S7-01，5 个指标）：
 *   1. totalMembers       — 总会员数（status=1）
 *   2. newMembersThisMonth — 本月新增会员数
 *   3. pendingAuditCount  — 待审核总数（资源 + 需求）
 *   4. totalMatchCount    — 总对接数
 *   5. matchSuccessRate   — 对接成功率（0–100.00）
 */
@Data
public class DashboardOverviewVO {
    private long totalMembers;
    private long newMembersThisMonth;
    private long pendingAuditCount;
    private long totalMatchCount;
    private BigDecimal matchSuccessRate;
}
