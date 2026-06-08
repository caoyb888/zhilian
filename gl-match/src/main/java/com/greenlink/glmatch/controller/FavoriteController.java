package com.greenlink.glmatch.controller;

import com.greenlink.common.result.Result;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmatch.dto.request.FavoriteRequest;
import com.greenlink.glmatch.dto.response.FavoriteVO;
import com.greenlink.glmatch.service.FavoriteService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 收藏/取消收藏接口（S5-09）。
 *
 * <p>POST   /api/v1/favorites       — 收藏
 * <p>DELETE /api/v1/favorites       — 取消收藏
 * <p>GET    /api/v1/favorites/check — 是否已收藏
 * <p>GET    /api/v1/favorites       — 我的收藏列表（分页，按 bizType 分类）
 */
@Validated
@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping
    public Result<Void> add(
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId,
            @Valid @RequestBody FavoriteRequest req) {
        if (accountId == null) {
            return Result.fail(1001, "未登录");
        }
        favoriteService.add(accountId, req.getBizType(), req.getBizId());
        return Result.ok();
    }

    @DeleteMapping
    public Result<Void> remove(
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId,
            @Valid @RequestBody FavoriteRequest req) {
        if (accountId == null) {
            return Result.fail(1001, "未登录");
        }
        favoriteService.remove(accountId, req.getBizType(), req.getBizId());
        return Result.ok();
    }

    @GetMapping("/check")
    public Result<Boolean> check(
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId,
            @RequestParam @Pattern(regexp = "RESOURCE|DEMAND", message = "bizType 只能为 RESOURCE 或 DEMAND") String bizType,
            @RequestParam Long bizId) {
        if (accountId == null) {
            return Result.ok(false);
        }
        return Result.ok(favoriteService.check(accountId, bizType, bizId));
    }

    @GetMapping
    public Result<PageResult<FavoriteVO>> list(
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId,
            @RequestParam @Pattern(regexp = "RESOURCE|DEMAND", message = "bizType 只能为 RESOURCE 或 DEMAND") String bizType,
            @RequestParam(defaultValue = "1")  int page,
            @RequestParam(defaultValue = "20") int size) {
        if (accountId == null) {
            return Result.fail(1001, "未登录");
        }
        size = Math.min(Math.max(size, 1), 50);
        if (page < 1) page = 1;
        return Result.ok(favoriteService.list(accountId, bizType, page, size));
    }
}
