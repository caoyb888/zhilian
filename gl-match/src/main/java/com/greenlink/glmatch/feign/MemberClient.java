package com.greenlink.glmatch.feign;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.MemberBriefDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(name = "gl-member", url = "${gl.member.url:http://localhost:18082}", fallback = MemberClientFallback.class)
public interface MemberClient {

    @PostMapping("/api/v1/members/batch-brief")
    Result<List<MemberBriefDTO>> batchBrief(@RequestBody List<Long> ids);
}
