package com.greenlink.glauth.service;

import com.greenlink.glauth.dto.request.ChangePasswordRequest;
import com.greenlink.glauth.dto.request.LoginRequest;
import com.greenlink.glauth.dto.request.SmsLoginRequest;
import com.greenlink.glauth.dto.response.LoginResponse;
import com.greenlink.glauth.dto.response.TokenRefreshResponse;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {

    LoginResponse login(LoginRequest request, HttpServletRequest httpRequest);

    LoginResponse smsLogin(SmsLoginRequest request, HttpServletRequest httpRequest);

    TokenRefreshResponse refreshToken(String refreshToken);

    void logout(String accessToken, String refreshToken);

    void changePassword(Long accountId, ChangePasswordRequest request);
}
