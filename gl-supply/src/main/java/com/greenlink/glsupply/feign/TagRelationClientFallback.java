package com.greenlink.glsupply.feign;

import com.greenlink.common.result.Result;
import com.greenlink.glsupply.dto.response.TagSimpleVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class TagRelationClientFallback implements TagRelationClient {

    @Override
    public Result<List<TagSimpleVO>> getByBiz(String bizType, Long bizId) {
        log.warn("gl-tag getByBiz 降级, bizType={} bizId={}", bizType, bizId);
        return Result.ok(Collections.emptyList());
    }

    @Override
    public Result<Void> batchSet(Map<String, Object> request) {
        log.warn("gl-tag batchSet 降级, request={}", request);
        return Result.ok();
    }

    @Override
    public Result<Void> deleteByBiz(String bizType, Long bizId) {
        log.warn("gl-tag deleteByBiz 降级, bizType={} bizId={}", bizType, bizId);
        return Result.ok();
    }
}
