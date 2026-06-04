package com.greenlink.glmember.service;

import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glmember.domain.MemberAccount;
import com.greenlink.glmember.domain.MemberUnit;
import com.greenlink.glmember.dto.request.RegisterRequest;
import com.greenlink.glmember.dto.response.RegisterResponse;
import com.greenlink.glmember.repository.MemberAccountMapper;
import com.greenlink.glmember.repository.MemberUnitMapper;
import com.greenlink.glmember.repository.RbacAccountRoleMapper;
import com.greenlink.glmember.repository.RbacPermissionMapper;
import com.greenlink.glmember.repository.RbacRoleMapper;
import com.greenlink.glmember.repository.TagRelationMapper;
import com.greenlink.glmember.domain.RbacAccountRole;
import com.greenlink.glmember.service.impl.MemberServiceImpl;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @Mock private MemberUnitMapper memberUnitMapper;
    @Mock private MemberAccountMapper accountMapper;
    @Mock private RbacRoleMapper rbacRoleMapper;
    @Mock private RbacAccountRoleMapper rbacAccountRoleMapper;
    @Mock private RbacPermissionMapper rbacPermissionMapper;
    @Mock private TagRelationMapper tagRelationMapper;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;

    @Spy
    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @InjectMocks
    private MemberServiceImpl memberService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    @Test
    void register_usernameExists() {
        when(valueOps.get("auth:sms:REGISTER:13812345678")).thenReturn("123456");
        when(accountMapper.findByUsername("existingUser")).thenReturn(buildAccount());

        RegisterRequest req = buildRegisterRequest();
        req.setUsername("existingUser");

        assertThatThrownBy(() -> memberService.register(req))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode())
                        .isEqualTo(ResultCode.USERNAME_EXISTS.getCode()));
    }

    @Test
    void register_phoneExists() {
        when(valueOps.get("auth:sms:REGISTER:13812345678")).thenReturn("123456");
        when(accountMapper.findByUsername("newUser")).thenReturn(null);
        when(accountMapper.findByPhone("13812345678")).thenReturn(buildAccount());

        RegisterRequest req = buildRegisterRequest();

        assertThatThrownBy(() -> memberService.register(req))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode())
                        .isEqualTo(ResultCode.PHONE_EXISTS.getCode()));
    }

    @Test
    void register_smsCodeInvalid() {
        when(valueOps.get("auth:sms:REGISTER:13812345678")).thenReturn("654321");

        RegisterRequest req = buildRegisterRequest(); // smsCode = "123456"

        assertThatThrownBy(() -> memberService.register(req))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode())
                        .isEqualTo(ResultCode.SMS_CODE_INVALID.getCode()));
    }

    @Test
    void register_success() {
        when(valueOps.get("auth:sms:REGISTER:13812345678")).thenReturn("123456");
        when(accountMapper.findByUsername("newUser")).thenReturn(null);
        when(accountMapper.findByPhone("13812345678")).thenReturn(null);
        when(memberUnitMapper.insert(any(MemberUnit.class))).thenAnswer(inv -> {
            MemberUnit u = inv.getArgument(0);
            u.setId(100L);
            return 1;
        });
        when(accountMapper.insert(any(MemberAccount.class))).thenAnswer(inv -> {
            MemberAccount a = inv.getArgument(0);
            a.setId(200L);
            return 1;
        });
        when(rbacRoleMapper.findIdByCode("MEMBER")).thenReturn(3L);
        when(rbacAccountRoleMapper.insert(any(RbacAccountRole.class))).thenReturn(1);
        when(redisTemplate.delete(anyString())).thenReturn(true);

        RegisterResponse resp = memberService.register(buildRegisterRequest());

        assertThat(resp.getMemberId()).isEqualTo(100L);
        assertThat(resp.getAccountId()).isEqualTo(200L);
        assertThat(resp.getMemberStatus()).isEqualTo(2);
    }

    private RegisterRequest buildRegisterRequest() {
        RegisterRequest req = new RegisterRequest();
        req.setName("测试公司");
        req.setIndustry("新能源");
        req.setPhone("13812345678");
        req.setUsername("newUser");
        req.setPassword("P@ssw0rd123");
        req.setSmsCode("123456");
        req.setTagIds(List.of(1L, 2L));
        return req;
    }

    private MemberAccount buildAccount() {
        MemberAccount a = new MemberAccount();
        a.setId(1L);
        a.setMemberId(10L);
        a.setUsername("existingUser");
        a.setPhone("13812345678");
        a.setStatus(1);
        a.setIsDeleted(0);
        return a;
    }
}
