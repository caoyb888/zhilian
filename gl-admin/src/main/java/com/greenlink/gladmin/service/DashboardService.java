package com.greenlink.gladmin.service;

import com.greenlink.gladmin.dto.response.DashboardOverviewVO;

public interface DashboardService {

    /** 聚合 5 个核心看板指标（并发调用下游三个服务，容忍单服务降级） */
    DashboardOverviewVO getOverview();
}
