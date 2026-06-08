package com.greenlink.glmatch.controller;

import com.greenlink.common.result.Result;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmatch.dto.request.SendMessageRequest;
import com.greenlink.glmatch.dto.response.MarkReadVO;
import com.greenlink.glmatch.dto.response.MatchMessageVO;
import com.greenlink.glmatch.service.MatchMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 对接沟通消息接口（S6-01）。
 *
 * <ul>
 *   <li>POST   /api/v1/match/records/{matchId}/messages        发送消息</li>
 *   <li>GET    /api/v1/match/records/{matchId}/messages        消息历史（分页，ASC）</li>
 *   <li>PATCH  /api/v1/match/records/{matchId}/messages/read   全部标为已读</li>
 * </ul>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/match/records/{matchId}/messages")
@RequiredArgsConstructor
public class MatchMessageController {

    private final MatchMessageService matchMessageService;

    @PostMapping
    public Result<MatchMessageVO> send(
            @PathVariable Long matchId,
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId,
            @RequestHeader(value = "X-Member-Id",  required = false) Long memberId,
            @Valid @RequestBody SendMessageRequest req) {

        if (accountId == null || memberId == null) {
            return Result.fail(1001, "未登录");
        }
        return Result.ok(matchMessageService.send(matchId, accountId, memberId, req));
    }

    @GetMapping
    public Result<PageResult<MatchMessageVO>> list(
            @PathVariable Long matchId,
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId,
            @RequestHeader(value = "X-Member-Id",  required = false) Long memberId,
            @RequestParam(defaultValue = "1")  int page,
            @RequestParam(defaultValue = "20") int size) {

        if (accountId == null || memberId == null) {
            return Result.fail(1001, "未登录");
        }
        size = Math.min(Math.max(size, 1), 50);
        if (page < 1) page = 1;
        return Result.ok(matchMessageService.listMessages(matchId, accountId, memberId, page, size));
    }

    @PatchMapping("/read")
    public Result<MarkReadVO> markRead(
            @PathVariable Long matchId,
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId,
            @RequestHeader(value = "X-Member-Id",  required = false) Long memberId) {

        if (accountId == null || memberId == null) {
            return Result.fail(1001, "未登录");
        }
        return Result.ok(matchMessageService.markAllRead(matchId, accountId, memberId));
    }
}
