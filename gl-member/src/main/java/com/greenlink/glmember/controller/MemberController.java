package com.greenlink.glmember.controller;

import com.greenlink.common.result.Result;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmember.dto.request.AuditMemberRequest;
import com.greenlink.glmember.dto.request.MemberStatusRequest;
import com.greenlink.glmember.dto.request.RegisterRequest;
import com.greenlink.glmember.dto.request.UpdateMemberRequest;
import com.greenlink.glmember.dto.response.AdminAccountVO;
import com.greenlink.glmember.dto.response.MemberBriefVO;
import com.greenlink.glmember.dto.response.MemberDetailVO;
import com.greenlink.glmember.dto.response.MemberMeVO;
import com.greenlink.glmember.dto.response.MemberVO;
import com.greenlink.glmember.dto.response.RegisterResponse;
import com.greenlink.glmember.service.MemberService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    /** 会员注册（公开接口） */
    @PostMapping("/register")
    public Result<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse resp = memberService.register(request);
        return Result.ok(resp, "注册成功，请等待协会审核（预计1-3个工作日）");
    }

    /** 会员列表（公开，管理端可传 status 筛选） */
    @GetMapping
    public Result<PageResult<MemberVO>> listMembers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) Integer memberLevel,
            @RequestParam(required = false) Integer status) {
        return Result.ok(memberService.listMembers(page, size, keyword, industry, province, memberLevel, status));
    }

    /** 当前账号信息（含角色权限列表） */
    @GetMapping("/me")
    public Result<MemberMeVO> me(HttpServletRequest request) {
        Long accountId = extractAccountId(request);
        return Result.ok(memberService.getMe(accountId));
    }

    /** 会员单位详情 */
    @GetMapping("/{memberId}")
    public Result<MemberDetailVO> getDetail(@PathVariable Long memberId,
                                            HttpServletRequest request) {
        Long accountId = extractAccountIdOptional(request);
        return Result.ok(memberService.getDetail(memberId, accountId));
    }

    /** 更新会员单位（本单位主账号或管理员） */
    @PutMapping("/{memberId}")
    public Result<Void> updateMember(@PathVariable Long memberId,
                                     @Valid @RequestBody UpdateMemberRequest req,
                                     HttpServletRequest request) {
        Long accountId = extractAccountId(request);
        String roles = request.getHeader("X-Roles");
        memberService.updateMember(memberId, req, accountId, roles);
        return Result.ok();
    }

    /** 审核会员（AUDITOR / SUPER_ADMIN） */
    @PostMapping("/{memberId}/audit")
    public Result<Void> auditMember(@PathVariable Long memberId,
                                    @Valid @RequestBody AuditMemberRequest req,
                                    HttpServletRequest request) {
        requireAuditor(request);
        Long auditorId = extractAccountId(request);
        memberService.auditMember(memberId, req, auditorId);
        return Result.ok();
    }

    /** 管理员强制修改会员状态（SUPER_ADMIN） */
    @PatchMapping("/{memberId}/status")
    public Result<Void> updateMemberStatus(@PathVariable Long memberId,
                                           @Valid @RequestBody MemberStatusRequest req,
                                           HttpServletRequest request) {
        requireSuperAdmin(request);
        memberService.updateMemberStatus(memberId, req.getStatus());
        return Result.ok();
    }

    /** 批量查询会员单位简要信息（供服务间 Feign 内部调用） */
    @PostMapping("/batch-brief")
    public Result<List<MemberBriefVO>> batchBrief(@RequestBody List<Long> ids) {
        return Result.ok(memberService.batchBrief(ids));
    }

    /** 批量查询各会员主账号ID（供 gl-message 内部调用，无需鉴权） */
    @PostMapping("/internal/main-account-ids")
    public Result<java.util.Map<Long, Long>> getMainAccountIds(@RequestBody List<Long> memberIds) {
        return Result.ok(memberService.getMainAccountIdMap(memberIds));
    }

    /** 管理端账号列表（SUPER_ADMIN / AUDITOR） */
    @GetMapping("/accounts")
    public Result<PageResult<AdminAccountVO>> listAllAccounts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String keyword,
            HttpServletRequest request) {
        requireAuditor(request);
        return Result.ok(memberService.listAllAccounts(page, size, memberId, status, keyword));
    }

    private void requireAuditor(HttpServletRequest request) {
        String roles = request.getHeader("X-Roles");
        if (roles == null || (!roles.contains("SUPER_ADMIN") && !roles.contains("AUDITOR")
                && !roles.contains("CONTENT_ADMIN") && !roles.contains("FINANCE"))) {
            throw new com.greenlink.common.exception.BizException(
                    com.greenlink.common.result.ResultCode.FORBIDDEN);
        }
    }

    private void requireSuperAdmin(HttpServletRequest request) {
        String roles = request.getHeader("X-Roles");
        if (roles == null || !roles.contains("SUPER_ADMIN")) {
            throw new com.greenlink.common.exception.BizException(
                    com.greenlink.common.result.ResultCode.FORBIDDEN);
        }
    }

    private Long extractAccountId(HttpServletRequest request) {
        String header = request.getHeader("X-Account-Id");
        if (header == null || header.isBlank()) {
            throw new com.greenlink.common.exception.BizException(
                    com.greenlink.common.result.ResultCode.UNAUTHORIZED);
        }
        return Long.parseLong(header);
    }

    private Long extractAccountIdOptional(HttpServletRequest request) {
        String header = request.getHeader("X-Account-Id");
        if (header == null || header.isBlank()) return null;
        try {
            return Long.parseLong(header);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
