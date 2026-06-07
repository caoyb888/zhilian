package com.greenlink.glmatch.feign;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.TagSimpleDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@FeignClient(name = "gl-tag", url = "${gl.tag.url:http://localhost:8089}", fallback = TagClientFallback.class)
public interface TagClient {

    @GetMapping("/api/v1/tag-relations")
    Result<List<TagSimpleDTO>> getByBiz(@RequestParam("bizType") String bizType,
                                         @RequestParam("bizId") Long bizId);

    @GetMapping("/api/v1/tag-relations/biz-ids-batch")
    Result<Map<Long, List<Long>>> getBizIdsByTagsBatch(@RequestParam("tagIds") List<Long> tagIds,
                                                        @RequestParam("bizType") String bizType);
}
