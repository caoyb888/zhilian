package com.greenlink.glmatch.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.greenlink.common.result.Result;
import com.greenlink.glmatch.domain.MatchRecord;
import com.greenlink.glmatch.dto.response.MatchStatsVO;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/match/internal")
@RequiredArgsConstructor
public class InternalMatchController {

    private final MatchRecordMapper matchRecordMapper;

    /** 内部统计：总对接数 + 完成数 + 成功率，供 gl-admin 看板 Feign 调用 */
    @GetMapping("/stats")
    public Result<MatchStatsVO> stats() {
        long total = matchRecordMapper.selectCount(new QueryWrapper<MatchRecord>());
        long completed = matchRecordMapper.selectCount(
                new QueryWrapper<MatchRecord>().eq("status", 5));
        return Result.ok(MatchStatsVO.of(total, completed));
    }
}
