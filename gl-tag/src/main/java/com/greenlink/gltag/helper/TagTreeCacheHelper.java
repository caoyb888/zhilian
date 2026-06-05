package com.greenlink.gltag.helper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlink.gltag.dto.response.TagCategoryVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TagTreeCacheHelper {

    public static final String KEY = "tag:tree:all";
    private static final Duration TTL = Duration.ofHours(1);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public List<TagCategoryVO> get() {
        String json = redisTemplate.opsForValue().get(KEY);
        if (json == null) {
            return null;
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("tag tree cache deserialize failed, evicting key", e);
            evict();
            return null;
        }
    }

    public void set(List<TagCategoryVO> tree) {
        try {
            String json = objectMapper.writeValueAsString(tree);
            redisTemplate.opsForValue().set(KEY, json, TTL);
        } catch (Exception e) {
            log.warn("tag tree cache serialize failed", e);
        }
    }

    public void evict() {
        redisTemplate.delete(KEY);
    }
}
