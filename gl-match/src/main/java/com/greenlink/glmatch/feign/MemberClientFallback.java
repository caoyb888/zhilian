package com.greenlink.glmatch.feign;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.MemberBriefDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class MemberClientFallback implements MemberClient {

    @Override
    public Result<List<MemberBriefDTO>> batchBrief(List<Long> ids) {
        log.warn("MemberClient.batchBrief 降级，ids={}", ids);
        return Result.ok(Collections.emptyList());
    }
}
