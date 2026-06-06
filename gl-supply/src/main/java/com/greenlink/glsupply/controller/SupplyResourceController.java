package com.greenlink.glsupply.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.result.Result;
import com.greenlink.glsupply.dto.request.CreateResourceRequest;
import com.greenlink.glsupply.dto.request.ResourcePageRequest;
import com.greenlink.glsupply.dto.request.UpdateResourceRequest;
import com.greenlink.glsupply.dto.response.ResourceDetailVO;
import com.greenlink.glsupply.dto.response.ResourceVO;
import com.greenlink.glsupply.service.SupplyResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/supply/resources")
@RequiredArgsConstructor
public class SupplyResourceController {

    private final SupplyResourceService resourceService;

    @GetMapping
    public Result<Page<ResourceVO>> pageList(@ModelAttribute ResourcePageRequest request) {
        return Result.ok(resourceService.pageList(request));
    }

    @GetMapping("/{id}")
    public Result<ResourceDetailVO> getById(
            @PathVariable Long id,
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId) {
        return Result.ok(resourceService.getById(id, accountId));
    }

    @PostMapping
    public Result<ResourceDetailVO> create(
            @Valid @RequestBody CreateResourceRequest request,
            @RequestHeader("X-Member-Id") Long memberId,
            @RequestHeader("X-Account-Id") Long accountId) {
        return Result.ok(resourceService.create(request, memberId, accountId));
    }

    @PutMapping("/{id}")
    public Result<ResourceDetailVO> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateResourceRequest request,
            @RequestHeader("X-Account-Id") Long accountId) {
        return Result.ok(resourceService.update(id, request, accountId));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(
            @PathVariable Long id,
            @RequestHeader("X-Account-Id") Long accountId) {
        resourceService.delete(id, accountId);
        return Result.ok();
    }

    @PatchMapping("/{id}/withdraw")
    public Result<Void> withdraw(
            @PathVariable Long id,
            @RequestHeader("X-Account-Id") Long accountId) {
        resourceService.withdraw(id, accountId);
        return Result.ok();
    }

    @GetMapping("/mine")
    public Result<Page<ResourceVO>> mine(
            @ModelAttribute ResourcePageRequest request,
            @RequestHeader("X-Member-Id") Long memberId) {
        return Result.ok(resourceService.minePageList(memberId, request));
    }
}
