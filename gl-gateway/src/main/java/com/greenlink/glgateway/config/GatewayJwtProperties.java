package com.greenlink.glgateway.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class GatewayJwtProperties {

    private String secret;

    /** 无需鉴权的路径前缀（Ant 风格） */
    private List<String> whitelist = List.of(
            "/api/v1/auth/login",
            "/api/v1/auth/sms-login",
            "/api/v1/auth/wechat-login",
            "/api/v1/auth/refresh-token",
            "/api/v1/auth/captcha",
            "/api/v1/auth/sms-code",
            "/api/v1/members/register",
            "/api/v1/portal/**",
            "/actuator/**"
    );

    /**
     * 可选认证路径（Ant 风格）：有 JWT 则注入 X-Account-Id/X-Member-Id，无 JWT 也放行。
     * 用于供需详情等对游客开放、但登录后需要显示额外信息的接口。
     */
    private List<String> optionalAuth = List.of();
}
