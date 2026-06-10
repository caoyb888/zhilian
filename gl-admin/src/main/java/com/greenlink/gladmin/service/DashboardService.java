package com.greenlink.gladmin.service;

import com.greenlink.gladmin.dto.response.AuditSummaryVO;
import com.greenlink.gladmin.dto.response.DashboardOverviewVO;

public interface DashboardService {

    /** 聚合 5 个核心看板指标（S7-01） */
    DashboardOverviewVO getOverview();

    /** 供需审核汇总：待审核数量 + 近7日逐日审核量（S7-02） */
    AuditSummaryVO getAuditSummary();
}
