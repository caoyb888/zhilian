package com.greenlink.glsupply.helper;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ResourceViewCountHelper {

    public static final String KEY_PREFIX = "supply:resource:vc:";

    private final StringRedisTemplate redisTemplate;

    public void increment(Long resourceId) {
        redisTemplate.opsForValue().increment(KEY_PREFIX + resourceId);
    }

    public Long getAndDelete(Long resourceId) {
        String val = redisTemplate.opsForValue().getAndDelete(KEY_PREFIX + resourceId);
        return val == null ? null : Long.parseLong(val);
    }
}
