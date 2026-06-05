package com.greenlink.glmember.client;

import com.greenlink.common.result.Result;
import com.greenlink.glmember.client.dto.BatchSetTagRelationsRequest;
import com.greenlink.glmember.client.dto.TagSimpleVO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "gl-tag", fallback = TagRelationClientFallback.class)
public interface TagRelationClient {

    @GetMapping("/api/v1/tag-relations")
    Result<List<TagSimpleVO>> getTagsByBiz(@RequestParam("bizType") String bizType,
                                            @RequestParam("bizId") Long bizId);

    @PostMapping("/api/v1/tag-relations/batch")
    Result<Void> batchSet(@RequestBody BatchSetTagRelationsRequest request);
}
