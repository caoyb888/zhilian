package com.greenlink.gladmin.feign;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.SupplyStatsDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SupplyClientFallback implements SupplyClient {

    @Override
    public Result<SupplyStatsDTO> getStats() {
        log.warn("gl-supply /internal/stats 调用失败，返回零值降级数据");
        SupplyStatsDTO dto = new SupplyStatsDTO();
        return Result.ok(dto);
    }
}
