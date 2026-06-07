package com.greenlink.glmatch.controller;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.request.FavoriteRequest;
import com.greenlink.glmatch.service.FavoriteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping
    public Result<Void> add(@RequestHeader(value = "X-Account-Id", required = false) Long accountId,
                            @Valid @RequestBody FavoriteRequest req) {
        if (accountId == null) {
            return Result.fail(1001, "未登录");
        }
        favoriteService.add(accountId, req.getBizType(), req.getBizId());
        return Result.ok();
    }

    @DeleteMapping
    public Result<Void> remove(@RequestHeader(value = "X-Account-Id", required = false) Long accountId,
                               @Valid @RequestBody FavoriteRequest req) {
        if (accountId == null) {
            return Result.fail(1001, "未登录");
        }
        favoriteService.remove(accountId, req.getBizType(), req.getBizId());
        return Result.ok();
    }

    @GetMapping("/check")
    public Result<Boolean> check(@RequestHeader(value = "X-Account-Id", required = false) Long accountId,
                                 @RequestParam String bizType,
                                 @RequestParam Long bizId) {
        if (accountId == null) {
            return Result.ok(false);
        }
        return Result.ok(favoriteService.check(accountId, bizType, bizId));
    }
}
