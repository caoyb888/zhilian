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
}
