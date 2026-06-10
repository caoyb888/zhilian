package com.greenlink.glmatch.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.greenlink.common.result.Result;
import com.greenlink.glmatch.domain.MatchRecord;
import com.greenlink.glmatch.dto.response.MatchDetailStatsVO;
import com.greenlink.glmatch.dto.response.MatchStatsVO;
import com.greenlink.glmatch.dto.response.MatchTrendDailyVO;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/match/internal")
@RequiredArgsConstructor
public class InternalMatchController {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final MatchRecordMapper matchRecordMapper;

    /** 内部统计：总对接数 + 完成数 + 成功率，供 gl-admin 看板 Feign 调用（S7-01） */
    @GetMapping("/stats")
    public Result<MatchStatsVO> stats() {
        long total = matchRecordMapper.selectCount(new QueryWrapper<MatchRecord>());
        long completed = matchRecordMapper.selectCount(
                new QueryWrapper<MatchRecord>().eq("status", 5));
        return Result.ok(MatchStatsVO.of(total, completed));
    }

    /**
     * 内部对接数据统计（S7-03）：总对接数 + 成功率 + 近30日逐日趋势。
     * 供 gl-admin BFF Feign 调用，无需鉴权。
     */
    @GetMapping("/match-stats")
    public Result<MatchDetailStatsVO> matchStats() {
        long total = matchRecordMapper.selectCount(new QueryWrapper<MatchRecord>());
        long completed = matchRecordMapper.selectCount(
                new QueryWrapper<MatchRecord>().eq("status", 5));

        LocalDate today = LocalDate.now();
        LocalDate startDay = today.minusDays(29);
        String startDate = startDay.format(DATE_FMT);
        String endDate   = today.format(DATE_FMT);

        List<Map<String, Object>> rows = matchRecordMapper.countCreatedByDay(startDate, endDate);
        Map<String, Long> dailyMap = new HashMap<>();
        for (Map<String, Object> row : rows) {
            String d   = (String) row.get("createdDate");
            Number cnt = (Number) row.get("cnt");
            if (d != null && cnt != null) {
                dailyMap.put(d, cnt.longValue());
            }
        }

        List<MatchTrendDailyVO> trend = new ArrayList<>(30);
        for (int i = 29; i >= 0; i--) {
            String d = today.minusDays(i).format(DATE_FMT);
            trend.add(new MatchTrendDailyVO(d, dailyMap.getOrDefault(d, 0L)));
        }

        MatchDetailStatsVO vo = new MatchDetailStatsVO();
        vo.setTotalMatchCount(total);
        vo.setCompletedMatchCount(completed);
        vo.setSuccessRate(total == 0 ? java.math.BigDecimal.ZERO
                : java.math.BigDecimal.valueOf(completed * 100L)
                        .divide(java.math.BigDecimal.valueOf(total), 2,
                                java.math.RoundingMode.HALF_UP));
        vo.setLast30DaysTrend(trend);
        return Result.ok(vo);
    }
}
