package com.greenlink.glmessage.controller;

import com.greenlink.common.result.Result;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmessage.dto.request.MarkAllReadRequest;
import com.greenlink.glmessage.dto.response.MessageVO;
import com.greenlink.glmessage.dto.response.UnreadCountVO;
import com.greenlink.glmessage.service.MessageQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageQueryService messageQueryService;

    /** 消息列表（分页）。channel 不传默认返回 SITE 站内信。*/
    @GetMapping
    public Result<PageResult<MessageVO>> list(
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId,
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) String bizType,
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (accountId == null) {
            return Result.fail(1001, "未登录");
        }
        return Result.ok(messageQueryService.pageList(accountId, channel, bizType, isRead, page, size));
    }

    /** 未读消息数（按业务类型细分）。*/
    @GetMapping("/unread-count")
    public Result<UnreadCountVO> unreadCount(
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId) {
        if (accountId == null) {
            return Result.fail(1001, "未登录");
        }
        return Result.ok(messageQueryService.unreadCount(accountId));
    }

    /** 标记单条消息已读。*/
    @PatchMapping("/{messageId}/read")
    public Result<Void> markRead(
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId,
            @PathVariable Long messageId) {
        if (accountId == null) {
            return Result.fail(1001, "未登录");
        }
        messageQueryService.markRead(accountId, messageId);
        return Result.ok();
    }

    /** 全部标记已读；请求体 bizType 可选，不传则全部标记。*/
    @PatchMapping("/read-all")
    public Result<Void> markAllRead(
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId,
            @RequestBody(required = false) MarkAllReadRequest req) {
        if (accountId == null) {
            return Result.fail(1001, "未登录");
        }
        messageQueryService.markAllRead(accountId, req != null ? req.getBizType() : null);
        return Result.ok();
    }
}
