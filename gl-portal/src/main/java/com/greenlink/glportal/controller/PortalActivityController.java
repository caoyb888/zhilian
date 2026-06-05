package com.greenlink.glportal.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.result.Result;
import com.greenlink.glportal.dto.request.ActivityPageRequest;
import com.greenlink.glportal.dto.request.ActivitySignupRequest;
import com.greenlink.glportal.dto.request.ActivityStatusUpdateRequest;
import com.greenlink.glportal.dto.request.CreateActivityRequest;
import com.greenlink.glportal.dto.request.SignupPageRequest;
import com.greenlink.glportal.dto.request.UpdateActivityRequest;
import com.greenlink.glportal.dto.response.ActivityDetailVO;
import com.greenlink.glportal.dto.response.ActivityVO;
import com.greenlink.glportal.dto.response.SignupVO;
import com.greenlink.glportal.service.PortalActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/portal/activities")
@RequiredArgsConstructor
public class PortalActivityController {

    private final PortalActivityService activityService;

    // ─── 活动 CRUD ──────────────────────────────────────────────────────────

    @GetMapping
    public Result<Page<ActivityVO>> pageList(@ModelAttribute ActivityPageRequest request) {
        return Result.ok(activityService.pageList(request));
    }

    @GetMapping("/{id}")
    public Result<ActivityDetailVO> getById(@PathVariable Long id) {
        return Result.ok(activityService.getById(id));
    }

    @PostMapping
    public Result<ActivityDetailVO> create(@Valid @RequestBody CreateActivityRequest request) {
        return Result.ok(activityService.create(request));
    }

    @PutMapping("/{id}")
    public Result<ActivityDetailVO> update(@PathVariable Long id,
                                           @Valid @RequestBody UpdateActivityRequest request) {
        return Result.ok(activityService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        activityService.delete(id);
        return Result.ok();
    }

    @PatchMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id,
                                     @Valid @RequestBody ActivityStatusUpdateRequest request) {
        activityService.updateStatus(id, request.getStatus());
        return Result.ok();
    }

    // ─── 报名 ────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/signup")
    public Result<SignupVO> signup(
            @PathVariable Long id,
            @RequestBody(required = false) ActivitySignupRequest request,
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId) {
        return Result.ok(activityService.signup(id, accountId, memberId, request));
    }

    @DeleteMapping("/{id}/signup")
    public Result<Void> cancelSignup(
            @PathVariable Long id,
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId) {
        activityService.cancelSignup(id, accountId);
        return Result.ok();
    }

    @GetMapping("/{id}/signups")
    public Result<Page<SignupVO>> listSignups(
            @PathVariable Long id,
            @ModelAttribute SignupPageRequest request) {
        return Result.ok(activityService.listSignups(id, request));
    }

    @PatchMapping("/{id}/signups/{signupId}/checkin")
    public Result<Void> checkin(@PathVariable Long id, @PathVariable Long signupId) {
        activityService.checkin(id, signupId);
        return Result.ok();
    }
}
