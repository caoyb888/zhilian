package com.greenlink.glsupply.job;

import com.greenlink.glsupply.helper.ResourceViewCountHelper;
import com.greenlink.glsupply.repository.SupplyDemandMapper;
import com.greenlink.glsupply.repository.SupplyResourceMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.Collections;
import java.util.Set;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ViewCountFlushJobTest {

    @Mock StringRedisTemplate redisTemplate;
    @Mock ValueOperations<String, String> valueOps;
    @Mock SupplyResourceMapper resourceMapper;
    @Mock SupplyDemandMapper demandMapper;

    @InjectMocks ViewCountFlushJob job;

    // ─────────────────────────────────────────────
    // TC-01  资源浏览量回写 — 两个 key，均写入 DB
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-01 flush：资源 2 个 key，均回写到 resourceMapper")
    void flush_resource_twoKeys_bothFlushed() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(redisTemplate.keys(ResourceViewCountHelper.KEY_PREFIX + "*"))
                .thenReturn(Set.of(
                        ResourceViewCountHelper.KEY_PREFIX + "1",
                        ResourceViewCountHelper.KEY_PREFIX + "2"));
        when(redisTemplate.keys(ResourceViewCountHelper.DEMAND_KEY_PREFIX + "*"))
                .thenReturn(Collections.emptySet());
        when(valueOps.getAndDelete(ResourceViewCountHelper.KEY_PREFIX + "1")).thenReturn("5");
        when(valueOps.getAndDelete(ResourceViewCountHelper.KEY_PREFIX + "2")).thenReturn("3");

        job.flush();

        verify(resourceMapper).incrementViewCount(1L, 5L);
        verify(resourceMapper).incrementViewCount(2L, 3L);
        verify(demandMapper, never()).incrementViewCount(anyLong(), anyLong());
    }

    // ─────────────────────────────────────────────
    // TC-02  需求浏览量回写 — 1 个 key
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-02 flush：需求 1 个 key，回写到 demandMapper")
    void flush_demand_oneKey_flushed() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(redisTemplate.keys(ResourceViewCountHelper.KEY_PREFIX + "*"))
                .thenReturn(Collections.emptySet());
        when(redisTemplate.keys(ResourceViewCountHelper.DEMAND_KEY_PREFIX + "*"))
                .thenReturn(Set.of(ResourceViewCountHelper.DEMAND_KEY_PREFIX + "10"));
        when(valueOps.getAndDelete(ResourceViewCountHelper.DEMAND_KEY_PREFIX + "10")).thenReturn("7");

        job.flush();

        verify(demandMapper).incrementViewCount(10L, 7L);
        verify(resourceMapper, never()).incrementViewCount(anyLong(), anyLong());
    }

    // ─────────────────────────────────────────────
    // TC-03  Redis key 已过期（getAndDelete 返回 null）— 跳过
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-03 flush：getAndDelete 返回 null，不调用 DB")
    void flush_nullRedisValue_skipped() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(redisTemplate.keys(ResourceViewCountHelper.KEY_PREFIX + "*"))
                .thenReturn(Set.of(ResourceViewCountHelper.KEY_PREFIX + "99"));
        when(redisTemplate.keys(ResourceViewCountHelper.DEMAND_KEY_PREFIX + "*"))
                .thenReturn(Collections.emptySet());
        when(valueOps.getAndDelete(ResourceViewCountHelper.KEY_PREFIX + "99")).thenReturn(null);

        job.flush();

        verify(resourceMapper, never()).incrementViewCount(anyLong(), anyLong());
    }

    // ─────────────────────────────────────────────
    // TC-04  Redis 无 key — 不查询 DB
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-04 flush：Redis 无匹配 key，不调用任何 Mapper")
    void flush_noKeys_noDbCalls() {
        when(redisTemplate.keys(ResourceViewCountHelper.KEY_PREFIX + "*"))
                .thenReturn(Collections.emptySet());
        when(redisTemplate.keys(ResourceViewCountHelper.DEMAND_KEY_PREFIX + "*"))
                .thenReturn(null);

        job.flush();

        verify(resourceMapper, never()).incrementViewCount(anyLong(), anyLong());
        verify(demandMapper, never()).incrementViewCount(anyLong(), anyLong());
    }
}
