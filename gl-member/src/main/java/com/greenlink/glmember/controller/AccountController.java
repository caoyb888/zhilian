package com.greenlink.glmember.controller;

import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.Result;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glmember.dto.request.AccountStatusRequest;
import com.greenlink.glmember.dto.request.CreateSubAccountRequest;
import com.greenlink.glmember.dto.response.AccountVO;
import com.greenlink.glmember.service.AccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/members/{memberId}/sub-accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    /** 创建子账号（主账号权限） */
    @PostMapping
    public Result<AccountVO> createSubAccount(@PathVariable Long memberId,
                                              @Valid @RequestBody CreateSubAccountRequest request,
                                              HttpServletRequest httpRequest) {
        Long accountId = extractAccountId(httpRequest);
        return Result.ok(accountService.createSubAccount(memberId, request, accountId));
    }

    /** 子账号列表（本单位账号可查） */
    @GetMapping
    public Result<List<AccountVO>> listSubAccounts(@PathVariable Long memberId,
                                                   HttpServletRequest httpRequest) {
        Long accountId = extractAccountId(httpRequest);
        return Result.ok(accountService.listSubAccounts(memberId, accountId));
    }

    /** 禁用/启用子账号 */
    @PatchMapping("/{accountId}")
    public Result<Void> updateAccountStatus(@PathVariable Long memberId,
                                            @PathVariable Long accountId,
                                            @Valid @RequestBody AccountStatusRequest request,
                                            HttpServletRequest httpRequest) {
        Long requestingAccountId = extractAccountId(httpRequest);
        String roles = httpRequest.getHeader("X-Roles");
        accountService.updateAccountStatus(memberId, accountId, request, requestingAccountId, roles);
        return Result.ok();
    }

    private Long extractAccountId(HttpServletRequest request) {
        String header = request.getHeader("X-Account-Id");
        if (header == null || header.isBlank()) {
            throw new BizException(ResultCode.UNAUTHORIZED);
        }
        return Long.parseLong(header);
    }
}
