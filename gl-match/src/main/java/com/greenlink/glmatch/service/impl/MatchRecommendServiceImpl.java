package com.greenlink.glmatch.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlink.glmatch.engine.recall.MergedRecallCandidate;
import com.greenlink.glmatch.engine.score.MatchScoreResult;
import com.greenlink.glmatch.service.MatchRecommendService;
import com.greenlink.glmatch.service.MatchScoreCalculator;
import com.greenlink.glmatch.service.MergedRecallService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.Collections;
import java.util.List;

/**
 * 匹配推荐编排实现（S5-03）。
 *
 * <p>Pipeline：MergedRecallService.recall → MatchScoreCalculator.score → Redis 缓存 5min
 *
 * <p>缓存 key：{@code match:rec:{sourceMemberId}:{sourceBizId}}
 * 缓存存储 JSON 字符串，用 StringRedisTemplate 操作避免泛型类型擦除问题。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchRecommendServiceImpl implements MatchRecommendService {

    private static final String CACHE_KEY_PREFIX = "match:rec:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);
    private static final int MAX_CANDIDATES = 200;

    private final MergedRecallService mergedRecallService;
    private final MatchScoreCalculator matchScoreCalculator;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public List<MatchScoreResult> recommend(String sourceBizType, Long sourceBizId,
                                             String sourceProvince, Long sourceMemberId,
                                             int topN) {
        String cacheKey = CACHE_KEY_PREFIX + sourceMemberId + ":" + sourceBizId;

        // 读缓存
        String cached = safeGet(cacheKey);
        if (StringUtils.hasText(cached)) {
            try {
                List<MatchScoreResult> fromCache = objectMapper.readValue(
                        cached, new TypeReference<List<MatchScoreResult>>() {});
                log.debug("推荐命中缓存 key={} size={}", cacheKey, fromCache.size());
                return fromCache;
            } catch (Exception e) {
                log.warn("推荐缓存反序列化失败 key={}", cacheKey, e);
            }
        }

        // 执行 recall → score
        String targetBizType = "RESOURCE".equals(sourceBizType) ? "DEMAND" : "RESOURCE";
        List<MergedRecallCandidate> candidates = mergedRecallService.recall(
                sourceBizType, sourceBizId, targetBizType, sourceProvince, MAX_CANDIDATES);

        List<MatchScoreResult> result = matchScoreCalculator.score(
                candidates, sourceBizType, sourceBizId, sourceProvince, sourceMemberId, topN);

        // 写缓存（结果为空时也缓存，防止穿透，TTL 仍为 5min）
        try {
            stringRedisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(result), CACHE_TTL);
        } catch (Exception e) {
            log.warn("推荐结果写缓存失败 key={}", cacheKey, e);
        }

        log.debug("推荐计算完成 source={}/{} candidates={} returned={}",
                sourceBizType, sourceBizId, candidates.size(), result.size());
        return result;
    }

    private String safeGet(String key) {
        try {
            return stringRedisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.warn("Redis 读取失败 key={}", key, e);
            return null;
        }
    }
}
