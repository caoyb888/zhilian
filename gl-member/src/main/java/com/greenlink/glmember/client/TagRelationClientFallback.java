package com.greenlink.glmember.client;

import com.greenlink.common.result.Result;
import com.greenlink.glmember.client.dto.BatchSetTagRelationsRequest;
import com.greenlink.glmember.client.dto.TagSimpleVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class TagRelationClientFallback implements TagRelationClient {

    @Override
    public Result<List<TagSimpleVO>> getTagsByBiz(String bizType, Long bizId) {
        log.warn("gl-tag 服务不可用，getTagsByBiz 降级返回空列表 bizType={} bizId={}", bizType, bizId);
        return Result.ok(List.of());
    }

    @Override
    public Result<Void> batchSet(BatchSetTagRelationsRequest request) {
        log.warn("gl-tag 服务不可用，batchSet 降级跳过 bizType={} bizId={}",
                request.getBizType(), request.getBizId());
        return Result.ok();
    }
}
