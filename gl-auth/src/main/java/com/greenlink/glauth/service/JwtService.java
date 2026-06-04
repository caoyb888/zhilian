package com.greenlink.glauth.service;

import com.greenlink.glauth.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class JwtService {

    private static final String CLAIM_ACCOUNT_ID = "accountId";
    private static final String CLAIM_MEMBER_ID = "memberId";
    private static final String CLAIM_ROLES = "roles";
    private static final String BLACKLIST_PREFIX = "auth:bl:";

    private final JwtProperties jwtProperties;
    private final StringRedisTemplate redisTemplate;

    public String generateAccessToken(Long accountId, Long memberId, List<String> roles) {
        String jti = UUID.randomUUID().toString().replace("-", "");
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getAccessTokenExpire() * 1000L);
        return Jwts.builder()
                .id(jti)
                .subject(String.valueOf(accountId))
                .claim(CLAIM_ACCOUNT_ID, accountId)
                .claim(CLAIM_MEMBER_ID, memberId)
                .claim(CLAIM_ROLES, roles)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    public String generateRefreshToken(Long accountId) {
        String token = "rt_" + UUID.randomUUID().toString().replace("-", "");
        redisTemplate.opsForValue().set(
                "auth:rt:" + token,
                String.valueOf(accountId),
                jwtProperties.getRefreshTokenExpire(),
                TimeUnit.SECONDS
        );
        return token;
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 验证 Token 是否有效（含签名、有效期、黑名单检查）
     */
    public boolean isTokenValid(String token) {
        try {
            Claims claims = parseToken(token);
            String jti = claims.getId();
            return !isBlacklisted(jti);
        } catch (ExpiredJwtException e) {
            log.debug("Token 已过期: {}", e.getMessage());
            return false;
        } catch (JwtException e) {
            log.warn("Token 解析失败: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 登出时将 accessToken 加入黑名单（TTL = Token 剩余有效期）
     */
    public void blacklistToken(String token) {
        try {
            Claims claims = parseToken(token);
            String jti = claims.getId();
            long remainMs = claims.getExpiration().getTime() - System.currentTimeMillis();
            if (remainMs > 0) {
                redisTemplate.opsForValue().set(
                        BLACKLIST_PREFIX + jti,
                        "1",
                        remainMs,
                        TimeUnit.MILLISECONDS
                );
            }
        } catch (ExpiredJwtException e) {
            // 已过期的 token 不需要加黑名单
        } catch (JwtException e) {
            log.warn("黑名单操作失败，token 非法: {}", e.getMessage());
        }
    }

    private boolean isBlacklisted(String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + jti));
    }

    /**
     * 消费 Refresh Token：验证有效性，返回 accountId；消费后删除旧 token
     */
    public Long consumeRefreshToken(String refreshToken) {
        String key = "auth:rt:" + refreshToken;
        String accountIdStr = redisTemplate.opsForValue().get(key);
        if (accountIdStr == null) {
            return null;
        }
        redisTemplate.delete(key);
        return Long.parseLong(accountIdStr);
    }

    public void revokeRefreshToken(String refreshToken) {
        redisTemplate.delete("auth:rt:" + refreshToken);
    }

    public long getAccessTokenExpire() {
        return jwtProperties.getAccessTokenExpire();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> extractClaims(String token) {
        try {
            Claims claims = parseToken(token);
            return Map.of(
                    CLAIM_ACCOUNT_ID, claims.get(CLAIM_ACCOUNT_ID, Long.class),
                    CLAIM_MEMBER_ID, claims.get(CLAIM_MEMBER_ID, Long.class),
                    CLAIM_ROLES, claims.get(CLAIM_ROLES, List.class)
            );
        } catch (JwtException e) {
            return Map.of();
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
