package com.greenlink.glmatch.controller;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.request.MatchApplyRequest;
import com.greenlink.glmatch.dto.response.MatchApplyVO;
import com.greenlink.glmatch.service.MatchApplyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 对接申请接口（S5-05）。
 *
 * <p>{@code POST /api/v1/match/apply}（需登录，Gateway 鉴权）
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/match")
@RequiredArgsConstructor
public class MatchApplyController {

    private final MatchApplyService matchApplyService;

    /**
     * 发起对接申请。
     *
     * <p>调用方必须是 resourceId 或 demandId 的所有者；同一对存在进行中记录时返回 code:3102。
     */
    @PostMapping("/apply")
    public Result<MatchApplyVO> apply(
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            @Valid @RequestBody MatchApplyRequest req) {

        if (accountId == null || memberId == null) {
            return Result.fail(1001, "未登录");
        }
        MatchApplyVO vo = matchApplyService.apply(accountId, memberId, req);
        return Result.ok(vo);
    }
}
