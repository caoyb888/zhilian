package com.greenlink.glportal.helper;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ViewCountHelper {

    public static final String KEY_PREFIX = "portal:article:vc:";

    private final StringRedisTemplate redisTemplate;

    public void increment(Long articleId) {
        redisTemplate.opsForValue().increment(KEY_PREFIX + articleId);
    }

    public Long getAndDelete(Long articleId) {
        String key = KEY_PREFIX + articleId;
        String val = redisTemplate.opsForValue().getAndDelete(key);
        return val == null ? null : Long.parseLong(val);
    }
}
