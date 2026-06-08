package com.greenlink.glgateway.filter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlink.glgateway.config.GatewayJwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private static final String BLACKLIST_PREFIX = "auth:bl:";
    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    private final GatewayJwtProperties jwtProperties;
    private final ReactiveStringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public int getOrder() {
        return -100;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        if (isWhitelisted(path)) {
            return chain.filter(exchange);
        }

        String token = extractToken(exchange.getRequest());

        // 可选认证路径：有 JWT 则注入头，无 JWT 直接放行
        if (isOptionalAuth(path)) {
            if (token == null) {
                return chain.filter(exchange);
            }
            Claims claims;
            try {
                claims = parseToken(token);
            } catch (JwtException e) {
                return chain.filter(exchange);
            }
            ServerHttpRequest mutated = exchange.getRequest().mutate()
                    .header("X-Account-Id", String.valueOf(claims.get("accountId")))
                    .header("X-Member-Id", String.valueOf(claims.get("memberId")))
                    .header("X-Roles", buildRolesHeader(claims))
                    .build();
            return chain.filter(exchange.mutate().request(mutated).build());
        }

        if (token == null) {
            return unauthorized(exchange, 1002, "未登录或登录已过期");
        }

        Claims claims;
        try {
            claims = parseToken(token);
        } catch (ExpiredJwtException e) {
            return unauthorized(exchange, 2005, "Token 已过期");
        } catch (JwtException e) {
            return unauthorized(exchange, 2006, "Token 非法");
        }

        String jti = claims.getId();
        return redisTemplate.hasKey(BLACKLIST_PREFIX + jti)
                .flatMap(blacklisted -> {
                    if (Boolean.TRUE.equals(blacklisted)) {
                        return unauthorized(exchange, 1002, "Token 已失效，请重新登录");
                    }
                    ServerHttpRequest mutated = exchange.getRequest().mutate()
                            .header("X-Account-Id", String.valueOf(claims.get("accountId")))
                            .header("X-Member-Id", String.valueOf(claims.get("memberId")))
                            .header("X-Roles", buildRolesHeader(claims))
                            .build();
                    return chain.filter(exchange.mutate().request(mutated).build());
                });
    }

    private boolean isWhitelisted(String path) {
        return jwtProperties.getWhitelist().stream()
                .anyMatch(pattern -> PATH_MATCHER.match(pattern, path));
    }

    private boolean isOptionalAuth(String path) {
        return jwtProperties.getOptionalAuth().stream()
                .anyMatch(pattern -> PATH_MATCHER.match(pattern, path));
    }

    private String extractToken(ServerHttpRequest request) {
        String header = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    private Claims parseToken(String token) {
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        SecretKey key = Keys.hmacShaKeyFor(keyBytes);
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    @SuppressWarnings("unchecked")
    private String buildRolesHeader(Claims claims) {
        Object rolesObj = claims.get("roles");
        if (rolesObj instanceof List<?> roles) {
            return String.join(",", (List<String>) roles);
        }
        return "";
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, int code, String msg) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "code", code,
                "msg", msg,
                "data", "",
                "timestamp", System.currentTimeMillis()
        );
        try {
            byte[] bytes = objectMapper.writeValueAsBytes(body);
            DataBuffer buffer = response.bufferFactory().wrap(bytes);
            return response.writeWith(Mono.just(buffer));
        } catch (JsonProcessingException e) {
            return response.setComplete();
        }
    }
}
