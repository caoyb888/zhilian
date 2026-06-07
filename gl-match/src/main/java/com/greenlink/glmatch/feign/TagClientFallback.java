package com.greenlink.glmatch.feign;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.TagSimpleDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class TagClientFallback implements TagClient {

    @Override
    public Result<List<TagSimpleDTO>> getByBiz(String bizType, Long bizId) {
        log.warn("gl-tag getByBiz 降级 bizType={} bizId={}", bizType, bizId);
        return Result.ok(Collections.emptyList());
    }

    @Override
    public Result<Map<Long, List<Long>>> getBizIdsByTagsBatch(List<Long> tagIds, String bizType) {
        log.warn("gl-tag getBizIdsByTagsBatch 降级 tagIds={} bizType={}", tagIds, bizType);
        return Result.ok(Collections.emptyMap());
    }
}
