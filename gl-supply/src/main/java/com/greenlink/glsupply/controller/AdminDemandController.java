package com.greenlink.glsupply.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.Result;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glsupply.dto.request.AdminDemandPageRequest;
import com.greenlink.glsupply.dto.request.AuditRequest;
import com.greenlink.glsupply.dto.request.BatchAuditRequest;
import com.greenlink.glsupply.dto.response.AdminDemandVO;
import com.greenlink.glsupply.dto.response.BatchAuditResultVO;
import com.greenlink.glsupply.service.SupplyDemandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

/**
 * 管理端需求审核接口，路径前缀 /api/v1/admin/supply/demands。
 * Gateway 负责校验 AUDITOR / SUPER_ADMIN 角色后转发，服务内不再重复鉴权。
 * X-Account-Id 由 Gateway 注入，用于记录审核人。
 */
@RestController
@RequestMapping("/api/v1/admin/supply/demands")
@RequiredArgsConstructor
public class AdminDemandController {

    private final SupplyDemandService demandService;

    @GetMapping
    public Result<Page<AdminDemandVO>> pageList(@ModelAttribute AdminDemandPageRequest request) {
        return Result.ok(demandService.adminPageList(request));
    }

    @PatchMapping("/{id}/approve")
    public Result<Void> approve(
            @PathVariable Long id,
            @RequestHeader("X-Account-Id") Long auditorId) {
        demandService.approve(id, auditorId);
        return Result.ok();
    }

    @PatchMapping("/{id}/reject")
    public Result<Void> reject(
            @PathVariable Long id,
            @Valid @RequestBody AuditRequest request,
            @RequestHeader("X-Account-Id") Long auditorId) {
        demandService.reject(id, auditorId, request.getRemark());
        return Result.ok();
    }

    @PatchMapping("/{id}/offline")
    public Result<Void> offline(
            @PathVariable Long id,
            @RequestHeader("X-Account-Id") Long auditorId) {
        demandService.adminOffline(id, auditorId);
        return Result.ok();
    }

    /** 批量审核通过（#6） */
    @PatchMapping("/batch-approve")
    public Result<BatchAuditResultVO> batchApprove(
            @Valid @RequestBody BatchAuditRequest request,
            @RequestHeader("X-Account-Id") Long auditorId) {
        return Result.ok(demandService.batchApprove(request.getIds(), auditorId));
    }

    /** 批量审核拒绝（#6），remark 必填 */
    @PatchMapping("/batch-reject")
    public Result<BatchAuditResultVO> batchReject(
            @Valid @RequestBody BatchAuditRequest request,
            @RequestHeader("X-Account-Id") Long auditorId) {
        if (!StringUtils.hasText(request.getRemark())) {
            throw new BizException(ResultCode.PARAM_ERROR, "批量拒绝时必须填写审核意见");
        }
        return Result.ok(demandService.batchReject(request.getIds(), auditorId, request.getRemark()));
    }
}
