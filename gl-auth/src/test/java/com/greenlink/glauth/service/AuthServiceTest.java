package com.greenlink.glauth.service;

import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glauth.domain.MemberAccount;
import com.greenlink.glauth.domain.MemberUnit;
import com.greenlink.glauth.dto.request.LoginRequest;
import com.greenlink.glauth.dto.response.LoginResponse;
import com.greenlink.glauth.repository.MemberAccountMapper;
import com.greenlink.glauth.repository.MemberLoginLogMapper;
import com.greenlink.glauth.repository.MemberUnitMapper;
import com.greenlink.glauth.repository.RbacRoleMapper;
import com.greenlink.glauth.service.impl.AuthServiceImpl;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentMatchers;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private MemberAccountMapper accountMapper;
    @Mock private MemberUnitMapper memberUnitMapper;
    @Mock private RbacRoleMapper rbacRoleMapper;
    @Mock private MemberLoginLogMapper loginLogMapper;
    @Mock private JwtService jwtService;
    @Mock private CaptchaService captchaService;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private HttpServletRequest httpRequest;

    @Spy
    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @InjectMocks
    private AuthServiceImpl authService;

    private static final String RAW_PASSWORD = "P@ssw0rd123";
    private MemberAccount account;

    @BeforeEach
    void setUp() {
        account = new MemberAccount();
        account.setId(1L);
        account.setMemberId(100L);
        account.setUsername("testuser");
        account.setPasswordHash(passwordEncoder.encode(RAW_PASSWORD));
        account.setStatus(1);
        account.setFailCount(0);
        account.setIsDeleted(0);

        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOps);
        lenient().when(httpRequest.getHeader(anyString())).thenReturn(null);
        lenient().when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
    }

    @Test
    void login_success() {
        when(accountMapper.findByUsername("testuser")).thenReturn(account);
        when(valueOps.get("auth:fc:testuser")).thenReturn(null);
        when(accountMapper.update(isNull(), any())).thenReturn(1);
        when(rbacRoleMapper.findRoleCodesByAccountId(1L)).thenReturn(List.of("MEMBER"));
        when(jwtService.generateAccessToken(anyLong(), anyLong(), anyList())).thenReturn("accessToken");
        when(jwtService.generateRefreshToken(anyLong())).thenReturn("rt_refreshToken");
        when(jwtService.getAccessTokenExpire()).thenReturn(7200L);
        when(memberUnitMapper.selectById(100L)).thenReturn(buildMemberUnit());

        LoginRequest request = buildLoginRequest(RAW_PASSWORD);
        LoginResponse response = authService.login(request, httpRequest);

        assertThat(response.getAccessToken()).isEqualTo("accessToken");
        assertThat(response.getRefreshToken()).isEqualTo("rt_refreshToken");
        assertThat(response.getAccountInfo().getRoles()).containsExactly("MEMBER");
    }

    @Test
    void login_wrongPassword() {
        when(accountMapper.findByUsername("testuser")).thenReturn(account);
        when(valueOps.get("auth:fc:testuser")).thenReturn("2");
        when(accountMapper.update(isNull(), any())).thenReturn(1);

        LoginRequest request = buildLoginRequest("WrongPassword");

        assertThatThrownBy(() -> authService.login(request, httpRequest))
                .isInstanceOf(BizException.class)
                .satisfies(e -> {
                    BizException be = (BizException) e;
                    assertThat(be.getCode()).isEqualTo(ResultCode.LOGIN_FAIL.getCode());
                    assertThat(be.getMessage()).contains("还可尝试");
                });
    }

    @Test
    void login_accountLocked() {
        account.setLockedUntil(LocalDateTime.now().plusMinutes(20));
        when(accountMapper.findByUsername("testuser")).thenReturn(account);

        LoginRequest request = buildLoginRequest(RAW_PASSWORD);

        assertThatThrownBy(() -> authService.login(request, httpRequest))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode())
                        .isEqualTo(ResultCode.ACCOUNT_LOCKED.getCode()));
    }

    @Test
    void login_accountDisabled() {
        account.setStatus(0);
        when(accountMapper.findByUsername("testuser")).thenReturn(account);

        LoginRequest request = buildLoginRequest(RAW_PASSWORD);

        assertThatThrownBy(() -> authService.login(request, httpRequest))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode())
                        .isEqualTo(ResultCode.ACCOUNT_DISABLED.getCode()));
    }

    private LoginRequest buildLoginRequest(String password) {
        LoginRequest req = new LoginRequest();
        req.setUsername("testuser");
        req.setPassword(password);
        return req;
    }

    private MemberUnit buildMemberUnit() {
        MemberUnit unit = new MemberUnit();
        unit.setId(100L);
        unit.setName("测试公司");
        unit.setMemberLevel(1);
        return unit;
    }
}
