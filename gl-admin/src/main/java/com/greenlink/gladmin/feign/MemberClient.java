package com.greenlink.gladmin.feign;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.MemberDetailStatsVO;
import com.greenlink.gladmin.dto.response.MemberStatsDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "gl-member", url = "${gl.member.url:http://localhost:18082}",
        fallback = MemberClientFallback.class)
public interface MemberClient {

    @GetMapping("/api/v1/members/internal/stats")
    Result<MemberStatsDTO> getStats();

    @GetMapping("/api/v1/members/internal/member-stats")
    Result<MemberDetailStatsVO> getMemberDetailStats();
}
