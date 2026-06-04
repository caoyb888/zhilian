package com.greenlink.glauth.controller;

import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.Result;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glauth.dto.request.ChangePasswordRequest;
import com.greenlink.glauth.dto.request.LoginRequest;
import com.greenlink.glauth.dto.request.RefreshTokenRequest;
import com.greenlink.glauth.dto.request.SmsCodeRequest;
import com.greenlink.glauth.dto.request.SmsLoginRequest;
import com.greenlink.glauth.dto.response.CaptchaResponse;
import com.greenlink.glauth.dto.response.LoginResponse;
import com.greenlink.glauth.dto.response.TokenRefreshResponse;
import com.greenlink.glauth.service.AuthService;
import com.greenlink.glauth.service.CaptchaService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CaptchaService captchaService;

    /** 账号密码登录 */
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                       HttpServletRequest httpRequest) {
        return Result.ok(authService.login(request, httpRequest));
    }

    /** 手机号短信登录 */
    @PostMapping("/sms-login")
    public Result<LoginResponse> smsLogin(@Valid @RequestBody SmsLoginRequest request,
                                          HttpServletRequest httpRequest) {
        return Result.ok(authService.smsLogin(request, httpRequest));
    }

    /** 刷新 Access Token */
    @PostMapping("/refresh-token")
    public Result<TokenRefreshResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return Result.ok(authService.refreshToken(request.getRefreshToken()));
    }

    /** 登出（Access Token 加黑名单，Refresh Token 吊销） */
    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest httpRequest,
                               @RequestParam(required = false) String refreshToken) {
        String accessToken = extractBearerToken(httpRequest);
        authService.logout(accessToken, refreshToken);
        return Result.ok();
    }

    /** 获取图形验证码 */
    @GetMapping("/captcha")
    public Result<CaptchaResponse> getCaptcha() {
        return Result.ok(captchaService.generate());
    }

    /** 发送短信验证码 */
    @PostMapping("/sms-code")
    public Result<Object> sendSmsCode(@Valid @RequestBody SmsCodeRequest request) {
        captchaService.sendSmsCode(request.getPhone(), request.getScene());
        return Result.ok(java.util.Map.of("expireIn", 300));
    }

    /** 修改密码（需要登录态） */
    @PostMapping("/change-password")
    public Result<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                       HttpServletRequest httpRequest) {
        Long accountId = (Long) httpRequest.getAttribute("accountId");
        if (accountId == null) {
            throw new BizException(ResultCode.UNAUTHORIZED);
        }
        authService.changePassword(accountId, request);
        return Result.ok();
    }

    private String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
