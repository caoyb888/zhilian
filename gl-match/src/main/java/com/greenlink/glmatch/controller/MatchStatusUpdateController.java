package com.greenlink.glmatch.controller;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.request.MatchStatusUpdateRequest;
import com.greenlink.glmatch.dto.response.MatchStatusUpdateVO;
import com.greenlink.glmatch.service.MatchStatusUpdateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 对接状态更新接口（S5-07）。
 *
 * <p>{@code PATCH /api/v1/match/records/{id}/status}（需登录，Gateway 鉴权）
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/match/records")
@RequiredArgsConstructor
public class MatchStatusUpdateController {

    private final MatchStatusUpdateService matchStatusUpdateService;

    /**
     * 更新对接状态：NEGOTIATE（进入洽谈）/ COMPLETE（完成）/ CANCEL（撤销）。
     */
    @PatchMapping("/{id}/status")
    public Result<MatchStatusUpdateVO> updateStatus(
            @PathVariable Long id,
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            @Valid @RequestBody MatchStatusUpdateRequest req) {

        if (accountId == null || memberId == null) {
            return Result.fail(1001, "未登录");
        }
        MatchStatusUpdateVO vo = matchStatusUpdateService.update(id, accountId, memberId, req);
        return Result.ok(vo);
    }
}
