package com.greenlink.gladmin.feign;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.MessageStatsVO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "gl-message", url = "${gl.message.url:http://localhost:8086}",
        fallback = MessageClientFallback.class)
public interface MessageClient {

    @GetMapping("/api/v1/messages/internal/stats")
    Result<MessageStatsVO> getMessageStats();
}
