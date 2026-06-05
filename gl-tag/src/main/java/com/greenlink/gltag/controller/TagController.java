package com.greenlink.gltag.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.result.Result;
import com.greenlink.common.util.PageResult;
import com.greenlink.gltag.dto.request.CreateTagRequest;
import com.greenlink.gltag.dto.request.UpdateTagRequest;
import com.greenlink.gltag.dto.response.TagVO;
import com.greenlink.gltag.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public Result<PageResult<TagVO>> list(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<TagVO> result = tagService.list(categoryId, keyword, page, size);
        return Result.ok(PageResult.of(result));
    }

    @GetMapping("/{id}")
    public Result<TagVO> getById(@PathVariable Long id) {
        return Result.ok(tagService.getById(id));
    }

    @PostMapping
    public Result<TagVO> create(@Valid @RequestBody CreateTagRequest request) {
        return Result.ok(tagService.create(request));
    }

    @PutMapping("/{id}")
    public Result<TagVO> update(@PathVariable Long id,
                                @Valid @RequestBody UpdateTagRequest request) {
        return Result.ok(tagService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        tagService.delete(id);
        return Result.ok();
    }
}
