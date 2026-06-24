package com.greenlink.glauth.service;

import cn.hutool.captcha.CaptchaUtil;
import cn.hutool.captcha.LineCaptcha;
import com.greenlink.glauth.dto.response.CaptchaResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class CaptchaService {

    private static final String CAPTCHA_PREFIX = "auth:captcha:";
    private static final int CAPTCHA_EXPIRE_SECONDS = 300;

    @Value("${sms.dev-default-code:}")
    private String devDefaultCode;

    private final StringRedisTemplate redisTemplate;

    public CaptchaResponse generate() {
        LineCaptcha captcha = CaptchaUtil.createLineCaptcha(120, 40, 4, 5);
        String code = captcha.getCode();
        String token = "cap_" + UUID.randomUUID().toString().replace("-", "");

        redisTemplate.opsForValue().set(
                CAPTCHA_PREFIX + token,
                code.toLowerCase(),
                CAPTCHA_EXPIRE_SECONDS,
                TimeUnit.SECONDS
        );

        return CaptchaResponse.builder()
                .captchaToken(token)
                .imageBase64("data:image/png;base64," + captcha.getImageBase64())
                .expireIn(CAPTCHA_EXPIRE_SECONDS)
                .build();
    }

    /**
     * 校验验证码（不区分大小写，校验后立即删除）
     */
    public boolean verify(String token, String code) {
        if (token == null || code == null) {
            return false;
        }
        String key = CAPTCHA_PREFIX + token;
        String stored = redisTemplate.opsForValue().get(key);
        if (stored == null) {
            return false;
        }
        boolean matched = stored.equalsIgnoreCase(code.trim());
        if (matched) {
            redisTemplate.delete(key);
        }
        return matched;
    }

    /**
     * 发送短信验证码（此处存入 Redis，实际环境对接 SMS 网关）
     */
    public void sendSmsCode(String phone, String scene) {
        String code = StringUtils.hasText(devDefaultCode) ? devDefaultCode
                : String.valueOf((int) ((Math.random() * 9 + 1) * 100000));
        String key = "auth:sms:" + scene + ":" + phone;

        // 1 分钟内同一手机号限 1 次
        String cooldownKey = "auth:sms:cd:" + phone;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(cooldownKey))) {
            throw new com.greenlink.common.exception.BizException(
                    com.greenlink.common.result.ResultCode.TOO_MANY_REQUESTS,
                    "发送过于频繁，请 1 分钟后再试"
            );
        }

        redisTemplate.opsForValue().set(key, code, 300, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(cooldownKey, "1", 60, TimeUnit.SECONDS);

        // 开发环境打印验证码，生产环境替换为 SMS 网关调用
        log.info("[SMS-DEV] phone={}, scene={}, code={}", phone, scene, code);
    }

    public boolean verifySmsCode(String phone, String scene, String code) {
        String key = "auth:sms:" + scene + ":" + phone;
        String stored = redisTemplate.opsForValue().get(key);
        if (stored == null || !stored.equals(code)) {
            return false;
        }
        redisTemplate.delete(key);
        return true;
    }
}
