package com.greenlink.gladmin.feign;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.SupplyStatsDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "gl-supply", url = "${gl.supply.url:http://localhost:8084}",
        fallback = SupplyClientFallback.class)
public interface SupplyClient {

    @GetMapping("/api/v1/supply/internal/stats")
    Result<SupplyStatsDTO> getStats();
}
