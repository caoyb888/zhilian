package com.greenlink.glsupply.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.result.Result;
import com.greenlink.glsupply.dto.request.CreateDemandRequest;
import com.greenlink.glsupply.dto.request.DemandPageRequest;
import com.greenlink.glsupply.dto.request.UpdateDemandRequest;
import com.greenlink.glsupply.dto.response.DemandDetailVO;
import com.greenlink.glsupply.dto.response.DemandVO;
import com.greenlink.glsupply.service.SupplyDemandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/supply/demands")
@RequiredArgsConstructor
public class SupplyDemandController {

    private final SupplyDemandService demandService;

    @GetMapping
    public Result<Page<DemandVO>> pageList(@ModelAttribute DemandPageRequest request) {
        return Result.ok(demandService.pageList(request));
    }

    @GetMapping("/{id}")
    public Result<DemandDetailVO> getById(@PathVariable Long id) {
        return Result.ok(demandService.getById(id));
    }

    @PostMapping
    public Result<DemandDetailVO> create(
            @Valid @RequestBody CreateDemandRequest request,
            @RequestHeader("X-Member-Id") Long memberId,
            @RequestHeader("X-Account-Id") Long accountId) {
        return Result.ok(demandService.create(request, memberId, accountId));
    }

    @PutMapping("/{id}")
    public Result<DemandDetailVO> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDemandRequest request,
            @RequestHeader("X-Account-Id") Long accountId) {
        return Result.ok(demandService.update(id, request, accountId));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(
            @PathVariable Long id,
            @RequestHeader("X-Account-Id") Long accountId) {
        demandService.delete(id, accountId);
        return Result.ok();
    }

    @PatchMapping("/{id}/close")
    public Result<Void> close(
            @PathVariable Long id,
            @RequestHeader("X-Account-Id") Long accountId) {
        demandService.close(id, accountId);
        return Result.ok();
    }

    @GetMapping("/mine")
    public Result<Page<DemandVO>> mine(
            @ModelAttribute DemandPageRequest request,
            @RequestHeader("X-Member-Id") Long memberId) {
        return Result.ok(demandService.minePageList(memberId, request));
    }
}
