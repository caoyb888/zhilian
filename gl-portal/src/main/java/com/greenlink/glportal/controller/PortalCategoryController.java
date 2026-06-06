package com.greenlink.glportal.controller;

import com.greenlink.common.result.Result;
import com.greenlink.glportal.dto.request.CreateCategoryRequest;
import com.greenlink.glportal.dto.request.UpdateCategoryRequest;
import com.greenlink.glportal.dto.response.CategoryVO;
import com.greenlink.glportal.service.PortalCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/portal-categories")
@RequiredArgsConstructor
public class PortalCategoryController {

    private final PortalCategoryService categoryService;

    @GetMapping
    public Result<List<CategoryVO>> listTree() {
        return Result.ok(categoryService.listTree());
    }

    @GetMapping("/{id}")
    public Result<CategoryVO> getById(@PathVariable Long id) {
        return Result.ok(categoryService.getById(id));
    }

    @PostMapping
    public Result<CategoryVO> create(@Valid @RequestBody CreateCategoryRequest request) {
        return Result.ok(categoryService.create(request));
    }

    @PutMapping("/{id}")
    public Result<CategoryVO> update(@PathVariable Long id,
                                     @Valid @RequestBody UpdateCategoryRequest request) {
        return Result.ok(categoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return Result.ok();
    }
}
