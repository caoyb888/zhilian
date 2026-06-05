package com.greenlink.glportal.helper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlink.glportal.dto.response.CategoryVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PortalCategoryCacheHelper {

    public static final String KEY = "portal:categories:tree";
    private static final Duration TTL = Duration.ofHours(1);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public List<CategoryVO> get() {
        String json = redisTemplate.opsForValue().get(KEY);
        if (json == null) {
            return null;
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("portal category tree cache deserialize failed, evicting key", e);
            evict();
            return null;
        }
    }

    public void set(List<CategoryVO> tree) {
        try {
            String json = objectMapper.writeValueAsString(tree);
            redisTemplate.opsForValue().set(KEY, json, TTL);
        } catch (Exception e) {
            log.warn("portal category tree cache serialize failed", e);
        }
    }

    public void evict() {
        redisTemplate.delete(KEY);
    }
}
