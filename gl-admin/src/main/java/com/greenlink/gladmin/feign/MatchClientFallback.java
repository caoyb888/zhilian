package com.greenlink.gladmin.feign;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.MatchDetailStatsVO;
import com.greenlink.gladmin.dto.response.MatchStatsDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;

@Slf4j
@Component
public class MatchClientFallback implements MatchClient {

    @Override
    public Result<MatchStatsDTO> getStats() {
        log.warn("gl-match /internal/stats 调用失败，返回零值降级数据");
        MatchStatsDTO dto = new MatchStatsDTO();
        dto.setSuccessRate(BigDecimal.ZERO);
        return Result.ok(dto);
    }

    @Override
    public Result<MatchDetailStatsVO> getMatchDetailStats() {
        log.warn("gl-match /internal/match-stats 调用失败，返回零值降级数据");
        MatchDetailStatsVO vo = new MatchDetailStatsVO();
        vo.setSuccessRate(BigDecimal.ZERO);
        vo.setLast30DaysTrend(new ArrayList<>());
        return Result.ok(vo);
    }
}
