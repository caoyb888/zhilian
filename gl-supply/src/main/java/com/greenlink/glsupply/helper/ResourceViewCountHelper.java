package com.greenlink.glsupply.helper;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ResourceViewCountHelper {

    public static final String KEY_PREFIX        = "supply:resource:vc:";
    public static final String DEMAND_KEY_PREFIX = "supply:demand:vc:";

    private final StringRedisTemplate redisTemplate;

    // ---- resource ----

    public void increment(Long resourceId) {
        redisTemplate.opsForValue().increment(KEY_PREFIX + resourceId);
    }

    public Long getAndDelete(Long resourceId) {
        String val = redisTemplate.opsForValue().getAndDelete(KEY_PREFIX + resourceId);
        return val == null ? null : Long.parseLong(val);
    }

    // ---- demand ----

    public void incrementDemand(Long demandId) {
        redisTemplate.opsForValue().increment(DEMAND_KEY_PREFIX + demandId);
    }

    public Long getDemandAndDelete(Long demandId) {
        String val = redisTemplate.opsForValue().getAndDelete(DEMAND_KEY_PREFIX + demandId);
        return val == null ? null : Long.parseLong(val);
    }
}
