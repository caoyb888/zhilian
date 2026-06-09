package com.greenlink.glmessage.feign;

import com.greenlink.common.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;

@FeignClient(name = "gl-member", url = "${gl.member.url:http://localhost:18082}")
public interface MemberInternalClient {

    @PostMapping("/api/v1/members/internal/main-account-ids")
    Result<Map<Long, Long>> getMainAccountIds(@RequestBody List<Long> memberIds);
}
