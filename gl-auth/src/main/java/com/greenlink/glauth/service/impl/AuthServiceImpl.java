package com.greenlink.glauth.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glauth.domain.MemberAccount;
import com.greenlink.glauth.domain.MemberLoginLog;
import com.greenlink.glauth.domain.MemberUnit;
import com.greenlink.glauth.dto.request.ChangePasswordRequest;
import com.greenlink.glauth.dto.request.LoginRequest;
import com.greenlink.glauth.dto.request.SmsLoginRequest;
import com.greenlink.glauth.dto.response.AccountInfoVO;
import com.greenlink.glauth.dto.response.LoginResponse;
import com.greenlink.glauth.dto.response.TokenRefreshResponse;
import com.greenlink.glauth.repository.MemberAccountMapper;
import com.greenlink.glauth.repository.MemberLoginLogMapper;
import com.greenlink.glauth.repository.MemberUnitMapper;
import com.greenlink.glauth.repository.RbacRoleMapper;
import com.greenlink.glauth.service.AuthService;
import com.greenlink.glauth.service.CaptchaService;
import com.greenlink.glauth.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String FAIL_COUNT_PREFIX = "auth:fc:";
    private static final int CAPTCHA_THRESHOLD = 5;
    private static final int LOCK_THRESHOLD = 10;
    private static final int LOCK_MINUTES = 30;
    private static final int FAIL_COUNT_TTL_MINUTES = 35;

    private final MemberAccountMapper accountMapper;
    private final MemberUnitMapper memberUnitMapper;
    private final RbacRoleMapper rbacRoleMapper;
    private final MemberLoginLogMapper loginLogMapper;
    private final JwtService jwtService;
    private final CaptchaService captchaService;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String clientIp = extractIp(httpRequest);

        MemberAccount account = findAccountByUsernameOrPhone(request.getUsername());
        if (account == null) {
            throw new BizException(ResultCode.LOGIN_FAIL, "用户名或密码错误");
        }

        checkAccountLocked(account);
        checkAccountEnabled(account);

        long failCount = getFailCount(request.getUsername());

        if (failCount >= CAPTCHA_THRESHOLD) {
            if (!captchaService.verify(request.getCaptchaToken(), request.getCaptchaCode())) {
                throw new BizException(ResultCode.CAPTCHA_INVALID, "验证码错误或已过期");
            }
        }

        if (!passwordEncoder.matches(request.getPassword(), account.getPasswordHash())) {
            handleLoginFailure(account, request.getUsername(), failCount + 1);
            long remaining = LOCK_THRESHOLD - failCount - 1;
            if (remaining <= 0) {
                throw new BizException(ResultCode.ACCOUNT_LOCKED, "账号已锁定，请 30 分钟后再试");
            }
            throw new BizException(ResultCode.LOGIN_FAIL,
                    "用户名或密码错误，还可尝试 " + remaining + " 次");
        }

        return buildLoginResponse(account, request.getTerminal(), clientIp);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LoginResponse smsLogin(SmsLoginRequest request, HttpServletRequest httpRequest) {
        String clientIp = extractIp(httpRequest);
        MemberAccount account = accountMapper.findByPhone(request.getPhone());
        if (account == null) {
            throw new BizException(ResultCode.USER_NOT_FOUND, "该手机号未注册");
        }
        checkAccountLocked(account);
        checkAccountEnabled(account);

        if (!captchaService.verifySmsCode(request.getPhone(), "LOGIN", request.getSmsCode())) {
            throw new BizException(ResultCode.SMS_CODE_INVALID, "短信验证码错误或已过期");
        }

        return buildLoginResponse(account, request.getTerminal(), clientIp);
    }

    @Override
    public TokenRefreshResponse refreshToken(String refreshToken) {
        Long accountId = jwtService.consumeRefreshToken(refreshToken);
        if (accountId == null) {
            throw new BizException(ResultCode.TOKEN_INVALID, "Refresh Token 无效或已过期");
        }

        MemberAccount account = accountMapper.selectById(accountId);
        if (account == null || account.getIsDeleted() == 1) {
            throw new BizException(ResultCode.USER_NOT_FOUND, "用户不存在");
        }
        checkAccountEnabled(account);

        List<String> roles = rbacRoleMapper.findRoleCodesByAccountId(accountId);
        String newAccessToken = jwtService.generateAccessToken(accountId, account.getMemberId(), roles);
        String newRefreshToken = jwtService.generateRefreshToken(accountId);

        return TokenRefreshResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresIn(jwtService.getAccessTokenExpire())
                .build();
    }

    @Override
    public void logout(String accessToken, String refreshToken) {
        if (accessToken != null) {
            jwtService.blacklistToken(accessToken);
        }
        if (refreshToken != null) {
            jwtService.revokeRefreshToken(refreshToken);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void changePassword(Long accountId, ChangePasswordRequest request) {
        MemberAccount account = accountMapper.selectById(accountId);
        if (account == null || account.getIsDeleted() == 1) {
            throw new BizException(ResultCode.USER_NOT_FOUND, "用户不存在");
        }
        if (!passwordEncoder.matches(request.getOldPassword(), account.getPasswordHash())) {
            throw new BizException(ResultCode.LOGIN_FAIL, "当前密码错误");
        }
        accountMapper.update(null, new UpdateWrapper<MemberAccount>()
                .eq("id", accountId)
                .set("password_hash", passwordEncoder.encode(request.getNewPassword()))
                .set("updated_at", LocalDateTime.now()));
    }

    // -------------------- private helpers --------------------

    private LoginResponse buildLoginResponse(MemberAccount account, String terminal, String clientIp) {
        List<String> roles = rbacRoleMapper.findRoleCodesByAccountId(account.getId());
        String accessToken = jwtService.generateAccessToken(account.getId(), account.getMemberId(), roles);
        String refreshToken = jwtService.generateRefreshToken(account.getId());

        updateLoginSuccess(account, clientIp);
        clearFailCount(account.getUsername());
        saveLoginLogAsync(account.getId(), clientIp, terminal, 1, null);

        MemberUnit unit = memberUnitMapper.selectById(account.getMemberId());
        AccountInfoVO accountInfo = AccountInfoVO.builder()
                .accountId(account.getId())
                .memberId(account.getMemberId())
                .username(account.getUsername())
                .realName(account.getRealName())
                .avatarUrl(account.getAvatarUrl())
                .roles(roles)
                .memberName(unit != null ? unit.getName() : null)
                .memberLevel(unit != null ? unit.getMemberLevel() : null)
                .build();

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtService.getAccessTokenExpire())
                .tokenType("Bearer")
                .accountInfo(accountInfo)
                .build();
    }

    private MemberAccount findAccountByUsernameOrPhone(String usernameOrPhone) {
        MemberAccount account = accountMapper.findByUsername(usernameOrPhone);
        if (account == null) {
            account = accountMapper.findByPhone(usernameOrPhone);
        }
        return account;
    }

    private void checkAccountLocked(MemberAccount account) {
        if (account.getLockedUntil() != null && account.getLockedUntil().isAfter(LocalDateTime.now())) {
            long minutesLeft = java.time.Duration.between(LocalDateTime.now(), account.getLockedUntil()).toMinutes() + 1;
            throw new BizException(ResultCode.ACCOUNT_LOCKED,
                    "账号已锁定，请 " + minutesLeft + " 分钟后再试");
        }
    }

    private void checkAccountEnabled(MemberAccount account) {
        if (account.getStatus() != null && account.getStatus() == 0) {
            throw new BizException(ResultCode.ACCOUNT_DISABLED);
        }
    }

    private long getFailCount(String username) {
        String val = redisTemplate.opsForValue().get(FAIL_COUNT_PREFIX + username);
        return val == null ? 0L : Long.parseLong(val);
    }

    private void handleLoginFailure(MemberAccount account, String username, long newFailCount) {
        redisTemplate.opsForValue().set(
                FAIL_COUNT_PREFIX + username,
                String.valueOf(newFailCount),
                FAIL_COUNT_TTL_MINUTES, TimeUnit.MINUTES
        );

        if (newFailCount >= LOCK_THRESHOLD) {
            LocalDateTime lockUntil = LocalDateTime.now().plusMinutes(LOCK_MINUTES);
            accountMapper.update(null, new UpdateWrapper<MemberAccount>()
                    .eq("id", account.getId())
                    .set("fail_count", newFailCount)
                    .set("locked_until", lockUntil)
                    .set("updated_at", LocalDateTime.now()));
        } else {
            accountMapper.update(null, new UpdateWrapper<MemberAccount>()
                    .eq("id", account.getId())
                    .set("fail_count", newFailCount)
                    .set("updated_at", LocalDateTime.now()));
        }
    }

    private void clearFailCount(String username) {
        redisTemplate.delete(FAIL_COUNT_PREFIX + username);
    }

    private void updateLoginSuccess(MemberAccount account, String ip) {
        accountMapper.update(null, new UpdateWrapper<MemberAccount>()
                .eq("id", account.getId())
                .set("fail_count", 0)
                .set("locked_until", null)
                .set("last_login_at", LocalDateTime.now())
                .set("last_login_ip", ip)
                .set("updated_at", LocalDateTime.now()));
    }

    @Async("asyncLoginLogExecutor")
    public void saveLoginLogAsync(Long accountId, String ip, String terminal, int result, String failReason) {
        try {
            MemberLoginLog log = MemberLoginLog.builder()
                    .accountId(accountId)
                    .loginTime(LocalDateTime.now())
                    .ip(ip)
                    .terminal(terminal)
                    .result(result)
                    .failReason(failReason)
                    .createdAt(LocalDateTime.now())
                    .build();
            loginLogMapper.insert(log);
        } catch (Exception e) {
            AuthServiceImpl.log.error("异步写入登录日志失败: accountId={}", accountId, e);
        }
    }

    private String extractIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
