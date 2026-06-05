package com.greenlink.gltag.controller;

import com.greenlink.common.result.Result;
import com.greenlink.gltag.dto.request.CreateTagCategoryRequest;
import com.greenlink.gltag.dto.request.UpdateTagCategoryRequest;
import com.greenlink.gltag.dto.response.TagCategoryVO;
import com.greenlink.gltag.service.TagCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tag-categories")
@RequiredArgsConstructor
public class TagCategoryController {

    private final TagCategoryService tagCategoryService;

    @GetMapping
    public Result<List<TagCategoryVO>> listAll() {
        return Result.ok(tagCategoryService.listAll());
    }

    @PostMapping
    public Result<TagCategoryVO> create(@Valid @RequestBody CreateTagCategoryRequest request) {
        return Result.ok(tagCategoryService.create(request));
    }

    @PutMapping("/{id}")
    public Result<TagCategoryVO> update(@PathVariable Long id,
                                        @Valid @RequestBody UpdateTagCategoryRequest request) {
        return Result.ok(tagCategoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        tagCategoryService.delete(id);
        return Result.ok();
    }
}
