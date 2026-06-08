package com.greenlink.glmatch.controller;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.request.MatchRespondRequest;
import com.greenlink.glmatch.dto.response.MatchRespondVO;
import com.greenlink.glmatch.service.MatchRespondService;
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
 * 响应对接申请（S5-06）。
 *
 * <p>{@code PATCH /api/v1/match/records/{id}/respond}（需登录，Gateway 鉴权）
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/match/records")
@RequiredArgsConstructor
public class MatchRespondController {

    private final MatchRespondService matchRespondService;

    /**
     * 接受或拒绝对接申请。
     *
     * <p>仅被申请方（非 initiator）可操作；status≠1 时返回 code:3103。
     */
    @PatchMapping("/{id}/respond")
    public Result<MatchRespondVO> respond(
            @PathVariable Long id,
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            @Valid @RequestBody MatchRespondRequest req) {

        if (accountId == null || memberId == null) {
            return Result.fail(1001, "未登录");
        }
        MatchRespondVO vo = matchRespondService.respond(id, accountId, memberId, req);
        return Result.ok(vo);
    }
}
