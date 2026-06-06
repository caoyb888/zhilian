package com.greenlink.glportal.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.result.Result;
import com.greenlink.glportal.dto.request.ActivityPublicPageRequest;
import com.greenlink.glportal.dto.response.ActivityDetailVO;
import com.greenlink.glportal.dto.response.ActivitySignupStatusVO;
import com.greenlink.glportal.dto.response.ActivityVO;
import com.greenlink.glportal.service.PortalActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/portal/public/activities")
@RequiredArgsConstructor
public class PortalActivityPublicController {

    private final PortalActivityService activityService;

    @GetMapping
    public Result<Page<ActivityVO>> publicPageList(@ModelAttribute ActivityPublicPageRequest request) {
        return Result.ok(activityService.publicPageList(request));
    }

    @GetMapping("/{id}")
    public Result<ActivityDetailVO> publicGetById(@PathVariable Long id) {
        return Result.ok(activityService.publicGetById(id));
    }

    @GetMapping("/{id}/my-signup")
    public Result<ActivitySignupStatusVO> getSignupStatus(
            @PathVariable Long id,
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId) {
        return Result.ok(activityService.getSignupStatus(id, accountId));
    }
}
