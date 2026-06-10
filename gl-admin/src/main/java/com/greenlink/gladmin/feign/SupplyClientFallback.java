package com.greenlink.gladmin.feign;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.AuditSummaryVO;
import com.greenlink.gladmin.dto.response.SupplyStatsDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;

@Slf4j
@Component
public class SupplyClientFallback implements SupplyClient {

    @Override
    public Result<SupplyStatsDTO> getStats() {
        log.warn("gl-supply /internal/stats 调用失败，返回零值降级数据");
        return Result.ok(new SupplyStatsDTO());
    }

    @Override
    public Result<AuditSummaryVO> getAuditSummary() {
        log.warn("gl-supply /internal/audit-summary 调用失败，返回零值降级数据");
        AuditSummaryVO vo = new AuditSummaryVO();
        vo.setLast7DaysAudit(new ArrayList<>());
        return Result.ok(vo);
    }
}
