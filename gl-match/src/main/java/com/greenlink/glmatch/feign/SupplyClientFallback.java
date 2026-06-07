package com.greenlink.glmatch.feign;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class SupplyClientFallback implements SupplyClient {

    @Override
    public Result<List<SupplyBriefDTO>> batchBriefResources(List<Long> ids) {
        log.warn("gl-supply batchBriefResources 降级 ids={}", ids);
        return Result.ok(Collections.emptyList());
    }

    @Override
    public Result<List<SupplyBriefDTO>> batchBriefDemands(List<Long> ids) {
        log.warn("gl-supply batchBriefDemands 降级 ids={}", ids);
        return Result.ok(Collections.emptyList());
    }

    @Override
    public Result<SupplyBriefDTO> getResourceMatchBrief(Long id) {
        log.warn("gl-supply getResourceMatchBrief 降级 id={}", id);
        return Result.ok(null);
    }

    @Override
    public Result<SupplyBriefDTO> getDemandMatchBrief(Long id) {
        log.warn("gl-supply getDemandMatchBrief 降级 id={}", id);
        return Result.ok(null);
    }
}
