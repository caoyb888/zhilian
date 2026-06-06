package com.greenlink.glportal.helper;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Redis SETNX 分布式锁，防止报名容量并发超卖。
 * 锁 TTL 5 s，足以覆盖一次报名事务。
 */
@Component
@RequiredArgsConstructor
public class SignupLockHelper {

    static final String LOCK_PREFIX = "portal:activity:signup:lock:";
    private static final Duration LOCK_TTL = Duration.ofSeconds(5);

    private final StringRedisTemplate redisTemplate;

    public boolean tryLock(Long activityId) {
        return Boolean.TRUE.equals(
                redisTemplate.opsForValue().setIfAbsent(LOCK_PREFIX + activityId, "1", LOCK_TTL));
    }

    public void releaseLock(Long activityId) {
        redisTemplate.delete(LOCK_PREFIX + activityId);
    }
}
