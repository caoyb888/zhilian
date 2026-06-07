package com.greenlink.gltag.controller;

import com.greenlink.common.result.Result;
import com.greenlink.gltag.dto.request.BatchSetTagRelationsRequest;
import com.greenlink.gltag.dto.response.TagSimpleVO;
import com.greenlink.gltag.service.TagRelationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tag-relations")
@RequiredArgsConstructor
public class TagRelationController {

    private final TagRelationService tagRelationService;

    @GetMapping
    public Result<List<TagSimpleVO>> getByBiz(@RequestParam String bizType,
                                               @RequestParam Long bizId) {
        return Result.ok(tagRelationService.getTagsByBiz(bizType, bizId));
    }

    @GetMapping("/biz-ids")
    public Result<List<Long>> getBizIdsByTag(@RequestParam Long tagId,
                                              @RequestParam String bizType) {
        return Result.ok(tagRelationService.getBizIdsByTag(tagId, bizType));
    }

    @GetMapping("/biz-ids-batch")
    public Result<Map<Long, List<Long>>> getBizIdsByTagsBatch(@RequestParam List<Long> tagIds,
                                                               @RequestParam String bizType) {
        return Result.ok(tagRelationService.getBizIdsByTagsBatch(tagIds, bizType));
    }

    @PostMapping("/batch")
    public Result<Void> batchSet(@Valid @RequestBody BatchSetTagRelationsRequest request) {
        tagRelationService.batchSet(request);
        return Result.ok();
    }

    @DeleteMapping
    public Result<Void> deleteByBiz(@RequestParam String bizType,
                                    @RequestParam Long bizId) {
        tagRelationService.deleteByBiz(bizType, bizId);
        return Result.ok();
    }
}
