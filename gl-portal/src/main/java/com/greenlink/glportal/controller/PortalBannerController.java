package com.greenlink.glportal.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.result.Result;
import com.greenlink.glportal.dto.request.BannerActiveRequest;
import com.greenlink.glportal.dto.request.BannerPageRequest;
import com.greenlink.glportal.dto.request.CreateBannerRequest;
import com.greenlink.glportal.dto.request.UpdateBannerRequest;
import com.greenlink.glportal.dto.response.BannerVO;
import com.greenlink.glportal.service.PortalBannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/portal/banners")
@RequiredArgsConstructor
public class PortalBannerController {

    private final PortalBannerService bannerService;

    /** 前台：获取当前有效轮播图列表（按 sort_order 排序） */
    @GetMapping
    public Result<List<BannerVO>> listActive() {
        return Result.ok(bannerService.listActive());
    }

    /** 管理端：分页查询（可按启用状态筛选） */
    @GetMapping("/admin")
    public Result<Page<BannerVO>> pageAdmin(@ModelAttribute BannerPageRequest request) {
        return Result.ok(bannerService.pageAdmin(request));
    }

    @GetMapping("/{id}")
    public Result<BannerVO> getById(@PathVariable Long id) {
        return Result.ok(bannerService.getById(id));
    }

    @PostMapping
    public Result<BannerVO> create(@Valid @RequestBody CreateBannerRequest request) {
        return Result.ok(bannerService.create(request));
    }

    @PutMapping("/{id}")
    public Result<BannerVO> update(@PathVariable Long id,
                                   @Valid @RequestBody UpdateBannerRequest request) {
        return Result.ok(bannerService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        bannerService.delete(id);
        return Result.ok();
    }

    @PatchMapping("/{id}/active")
    public Result<Void> updateActive(@PathVariable Long id,
                                     @Valid @RequestBody BannerActiveRequest request) {
        bannerService.updateActive(id, request.getIsActive());
        return Result.ok();
    }
}
