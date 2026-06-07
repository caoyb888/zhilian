package com.greenlink.glsupply.feign;

import com.greenlink.common.result.Result;
import com.greenlink.glsupply.dto.response.TagSimpleVO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@FeignClient(name = "gl-tag", fallback = TagRelationClientFallback.class)
public interface TagRelationClient {

    @GetMapping("/api/v1/tag-relations")
    Result<List<TagSimpleVO>> getByBiz(@RequestParam("bizType") String bizType,
                                       @RequestParam("bizId") Long bizId);

    @PostMapping("/api/v1/tag-relations/batch")
    Result<Void> batchSet(@RequestBody Map<String, Object> request);

    @DeleteMapping("/api/v1/tag-relations")
    Result<Void> deleteByBiz(@RequestParam("bizType") String bizType,
                              @RequestParam("bizId") Long bizId);
}
