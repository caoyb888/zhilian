package com.greenlink.glsupply.job;

import com.greenlink.glsupply.helper.ResourceViewCountHelper;
import com.greenlink.glsupply.repository.SupplyDemandMapper;
import com.greenlink.glsupply.repository.SupplyResourceMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.util.Set;
import java.util.function.BiConsumer;

/**
 * 每 60 秒将 Redis 中积累的浏览量增量回写到 MySQL。
 * 使用 GETDEL 原子操作：先取值再删 key，回写失败时增量丢失（浏览量允许近似值）。
 * 生产环境 keys() 为 O(N)，若 key 量级达万级可替换为 SCAN 迭代。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ViewCountFlushJob {

    private final StringRedisTemplate redisTemplate;
    private final SupplyResourceMapper resourceMapper;
    private final SupplyDemandMapper demandMapper;

    @Scheduled(fixedDelay = 60_000)
    public void flush() {
        int r = flushBizType(ResourceViewCountHelper.KEY_PREFIX,        resourceMapper::incrementViewCount);
        int d = flushBizType(ResourceViewCountHelper.DEMAND_KEY_PREFIX, demandMapper::incrementViewCount);
        if (r + d > 0) {
            log.info("浏览量回写完成 resource={} demand={}", r, d);
        }
    }

    private int flushBizType(String keyPrefix, BiConsumer<Long, Long> updater) {
        Set<String> keys = redisTemplate.keys(keyPrefix + "*");
        if (CollectionUtils.isEmpty(keys)) return 0;
        int count = 0;
        for (String key : keys) {
            String val = redisTemplate.opsForValue().getAndDelete(key);
            if (val == null) continue;
            long delta = Long.parseLong(val);
            if (delta <= 0) continue;
            Long id = Long.parseLong(key.substring(keyPrefix.length()));
            try {
                updater.accept(id, delta);
                count++;
            } catch (Exception e) {
                log.warn("浏览量回写失败 key={} delta={}", key, delta, e);
            }
        }
        return count;
    }
}
