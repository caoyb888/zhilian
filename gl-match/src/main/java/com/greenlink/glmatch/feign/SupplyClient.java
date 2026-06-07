package com.greenlink.glmatch.feign;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "gl-supply", url = "${gl.supply.url:http://localhost:8084}", fallback = SupplyClientFallback.class)
public interface SupplyClient {

    @PostMapping("/api/v1/supply/resources/batch-brief")
    Result<List<SupplyBriefDTO>> batchBriefResources(@RequestBody List<Long> ids);

    @PostMapping("/api/v1/supply/demands/batch-brief")
    Result<List<SupplyBriefDTO>> batchBriefDemands(@RequestBody List<Long> ids);
}
