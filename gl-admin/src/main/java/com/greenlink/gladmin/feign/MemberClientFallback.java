package com.greenlink.gladmin.feign;

import com.greenlink.common.result.Result;
import com.greenlink.gladmin.dto.response.MemberStatsDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class MemberClientFallback implements MemberClient {

    @Override
    public Result<MemberStatsDTO> getStats() {
        log.warn("gl-member /internal/stats 调用失败，返回零值降级数据");
        MemberStatsDTO dto = new MemberStatsDTO();
        return Result.ok(dto);
    }
}
