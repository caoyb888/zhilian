package com.greenlink.gladmin.feign;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.MatchDetailStatsVO;
import com.greenlink.gladmin.dto.response.MatchStatsDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "gl-match", url = "${gl.match.url:http://localhost:8085}",
        fallback = MatchClientFallback.class)
public interface MatchClient {

    @GetMapping("/api/v1/match/internal/stats")
    Result<MatchStatsDTO> getStats();

    @GetMapping("/api/v1/match/internal/match-stats")
    Result<MatchDetailStatsVO> getMatchDetailStats();
}
