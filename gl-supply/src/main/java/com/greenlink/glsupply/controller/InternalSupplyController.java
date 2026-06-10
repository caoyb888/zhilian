package com.greenlink.glsupply.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.greenlink.common.result.Result;
import com.greenlink.glsupply.domain.SupplyDemand;
import com.greenlink.glsupply.domain.SupplyResource;
import com.greenlink.glsupply.dto.response.SupplyStatsVO;
import com.greenlink.glsupply.enums.AuditStatus;
import com.greenlink.glsupply.repository.SupplyDemandMapper;
import com.greenlink.glsupply.repository.SupplyResourceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/supply/internal")
@RequiredArgsConstructor
public class InternalSupplyController {

    private final SupplyResourceMapper resourceMapper;
    private final SupplyDemandMapper demandMapper;

    /** 内部统计：待审核资源数 + 待审核需求数，供 gl-admin 看板 Feign 调用 */
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
}
