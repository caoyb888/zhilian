package com.greenlink.glmatch.controller;

import com.greenlink.common.result.Result;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmatch.dto.response.MatchRecordItemVO;
import com.greenlink.glmatch.service.MatchRecordListService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 我的对接记录列表接口（S5-08）。
 *
 * <p>{@code GET /api/v1/match/records/my}（需登录，Gateway 鉴权）
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/match/records")
@RequiredArgsConstructor
public class MatchRecordListController {

    private final MatchRecordListService matchRecordListService;

    /**
     * 查询我的对接记录列表（双向：我是资源方或需求方均纳入）。
     *
     * @param status 状态筛选（可选：1待响应 2已接受 3洽谈中 5已完成 6已拒绝 7已撤销）
     */
    @GetMapping("/my")
    public Result<PageResult<MatchRecordItemVO>> myRecords(
            @RequestHeader(value = "X-Account-Id", required = false) Long accountId,
            @RequestHeader(value = "X-Member-Id",  required = false) Long memberId,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1")  int page,
            @RequestParam(defaultValue = "10") int size) {

        if (accountId == null || memberId == null) {
            return Result.fail(1001, "未登录");
        }
        size = Math.min(Math.max(size, 1), 50);
        if (page < 1) page = 1;

        PageResult<MatchRecordItemVO> result =
                matchRecordListService.listMyRecords(accountId, memberId, status, page, size);
        return Result.ok(result);
    }
}
