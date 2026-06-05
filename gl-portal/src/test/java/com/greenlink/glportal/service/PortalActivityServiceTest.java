package com.greenlink.glportal.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glportal.domain.PortalActivity;
import com.greenlink.glportal.domain.PortalActivitySignup;
import com.greenlink.glportal.dto.request.ActivitySignupRequest;
import com.greenlink.glportal.dto.request.CreateActivityRequest;
import com.greenlink.glportal.dto.request.UpdateActivityRequest;
import com.greenlink.glportal.dto.response.ActivityDetailVO;
import com.greenlink.glportal.dto.response.SignupVO;
import com.greenlink.glportal.helper.SignupLockHelper;
import com.greenlink.glportal.repository.PortalActivityMapper;
import com.greenlink.glportal.repository.PortalActivitySignupMapper;
import com.greenlink.glportal.service.impl.PortalActivityServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PortalActivityServiceTest {

    @Mock PortalActivityMapper activityMapper;
    @Mock PortalActivitySignupMapper signupMapper;
    @Mock SignupLockHelper lockHelper;

    @InjectMocks PortalActivityServiceImpl service;

    private PortalActivity openActivity;
    private PortalActivity fullActivity;

    @BeforeEach
    void setUp() {
        openActivity = new PortalActivity();
        openActivity.setId(1L);
        openActivity.setTitle("绿色峰会 2026");
        openActivity.setStatus(2);            // 报名中
        openActivity.setRegCount(9);
        openActivity.setMaxCapacity(10);
        openActivity.setRegDeadline(LocalDateTime.now().plusDays(7));
        openActivity.setRegCount(0);

        fullActivity = new PortalActivity();
        fullActivity.setId(2L);
        fullActivity.setTitle("已满活动");
        fullActivity.setStatus(2);
        fullActivity.setRegCount(10);
        fullActivity.setMaxCapacity(10);
        fullActivity.setRegDeadline(LocalDateTime.now().plusDays(7));
    }

    // ─── 活动 CRUD ───────────────────────────────────────────────────────────

    @Test
    void create_success() {
        when(activityMapper.insert(any(PortalActivity.class))).thenReturn(1);

        CreateActivityRequest req = new CreateActivityRequest();
        req.setTitle("测试活动");
        req.setStatus(1);

        ActivityDetailVO result = service.create(req);

        assertThat(result.getTitle()).isEqualTo("测试活动");
        assertThat(result.getStatus()).isEqualTo(1);
        assertThat(result.getRegCount()).isEqualTo(0);
        verify(activityMapper).insert(any(PortalActivity.class));
    }

    @Test
    void update_success() {
        when(activityMapper.selectById(1L)).thenReturn(openActivity);
        when(activityMapper.updateById(any(PortalActivity.class))).thenReturn(1);

        UpdateActivityRequest req = new UpdateActivityRequest();
        req.setTitle("更新后标题");
        req.setLocation("济南国际会展中心");

        ActivityDetailVO result = service.update(1L, req);

        assertThat(result.getTitle()).isEqualTo("更新后标题");
        assertThat(result.getLocation()).isEqualTo("济南国际会展中心");
    }

    @Test
    void delete_notFound_throwsBizException() {
        when(activityMapper.selectById(999L)).thenReturn(null);

        assertThatThrownBy(() -> service.delete(999L))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("活动不存在");
    }

    @Test
    void updateStatus_success() {
        when(activityMapper.selectById(1L)).thenReturn(openActivity);
        when(activityMapper.updateById(any(PortalActivity.class))).thenReturn(1);

        service.updateStatus(1L, 3);

        assertThat(openActivity.getStatus()).isEqualTo(3);
    }

    // ─── 报名核心场景 ─────────────────────────────────────────────────────────

    @Test
    void signup_success() {
        when(activityMapper.selectById(1L)).thenReturn(openActivity, openActivity);
        when(signupMapper.countByActivityAndAccount(1L, 100L)).thenReturn(0L);
        when(lockHelper.tryLock(1L)).thenReturn(true);
        when(signupMapper.insert(any(PortalActivitySignup.class))).thenReturn(1);
        when(activityMapper.incrementRegCount(1L)).thenReturn(1);

        SignupVO result = service.signup(1L, 100L, 50L, null);

        assertThat(result.getActivityId()).isEqualTo(1L);
        assertThat(result.getAccountId()).isEqualTo(100L);
        assertThat(result.getStatus()).isEqualTo(1);
        verify(activityMapper).incrementRegCount(1L);
        verify(lockHelper).releaseLock(1L);
    }

    @Test
    void signup_activityFull_throwsBizException() {
        // 锁内二次检查发现已满
        when(activityMapper.selectById(2L)).thenReturn(fullActivity, fullActivity);
        when(signupMapper.countByActivityAndAccount(2L, 100L)).thenReturn(0L);
        when(lockHelper.tryLock(2L)).thenReturn(true);

        assertThatThrownBy(() -> service.signup(2L, 100L, 50L, null))
                .isInstanceOf(BizException.class)
                .extracting(e -> ((BizException) e).getCode())
                .isEqualTo(ResultCode.ACTIVITY_FULL.getCode());

        verify(lockHelper).releaseLock(2L);
    }

    @Test
    void signup_duplicate_throwsBizException() {
        when(activityMapper.selectById(1L)).thenReturn(openActivity);
        when(signupMapper.countByActivityAndAccount(1L, 100L)).thenReturn(1L);

        assertThatThrownBy(() -> service.signup(1L, 100L, 50L, null))
                .isInstanceOf(BizException.class)
                .extracting(e -> ((BizException) e).getCode())
                .isEqualTo(ResultCode.SIGNUP_DUPLICATE.getCode());

        verify(lockHelper, never()).tryLock(any());
    }

    @Test
    void signup_deadlineExceeded_throwsBizException() {
        openActivity.setRegDeadline(LocalDateTime.now().minusHours(1));
        when(activityMapper.selectById(1L)).thenReturn(openActivity);

        assertThatThrownBy(() -> service.signup(1L, 100L, 50L, null))
                .isInstanceOf(BizException.class)
                .extracting(e -> ((BizException) e).getCode())
                .isEqualTo(ResultCode.ACTIVITY_CLOSED.getCode());
    }

    @Test
    void signup_statusNotOpen_throwsBizException() {
        openActivity.setStatus(1);  // 筹备中
        when(activityMapper.selectById(1L)).thenReturn(openActivity);

        assertThatThrownBy(() -> service.signup(1L, 100L, 50L, null))
                .isInstanceOf(BizException.class)
                .extracting(e -> ((BizException) e).getCode())
                .isEqualTo(ResultCode.ACTIVITY_STATUS_NOT_OPEN.getCode());
    }

    @Test
    void signup_noLogin_throwsUnauthorized() {
        assertThatThrownBy(() -> service.signup(1L, null, null, null))
                .isInstanceOf(BizException.class)
                .extracting(e -> ((BizException) e).getCode())
                .isEqualTo(ResultCode.UNAUTHORIZED.getCode());
    }

    @Test
    void signup_lockFailed_throwsTooManyRequests() {
        when(activityMapper.selectById(1L)).thenReturn(openActivity);
        when(signupMapper.countByActivityAndAccount(1L, 100L)).thenReturn(0L);
        when(lockHelper.tryLock(1L)).thenReturn(false);

        assertThatThrownBy(() -> service.signup(1L, 100L, 50L, null))
                .isInstanceOf(BizException.class)
                .extracting(e -> ((BizException) e).getCode())
                .isEqualTo(ResultCode.TOO_MANY_REQUESTS.getCode());
    }

    // ─── 取消报名 ─────────────────────────────────────────────────────────────

    @Test
    void cancelSignup_success() {
        PortalActivitySignup signup = new PortalActivitySignup();
        signup.setId(5L);
        signup.setActivityId(1L);
        signup.setAccountId(100L);
        signup.setStatus(1);

        when(signupMapper.findIdByActivityAndAccount(1L, 100L)).thenReturn(5L);
        when(signupMapper.selectById(5L)).thenReturn(signup);
        when(signupMapper.updateById(any(PortalActivitySignup.class))).thenReturn(1);

        service.cancelSignup(1L, 100L);

        assertThat(signup.getStatus()).isEqualTo(3);
        verify(activityMapper).decrementRegCount(1L);
    }

    @Test
    void cancelSignup_notFound_throwsBizException() {
        when(signupMapper.findIdByActivityAndAccount(1L, 100L)).thenReturn(null);

        assertThatThrownBy(() -> service.cancelSignup(1L, 100L))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("未找到报名记录");
    }

    // ─── 签到 ──────────────────────────────────────────────────────────────────

    @Test
    void checkin_success() {
        PortalActivitySignup signup = new PortalActivitySignup();
        signup.setId(5L);
        signup.setActivityId(1L);
        signup.setStatus(1);

        when(signupMapper.selectById(5L)).thenReturn(signup);
        when(signupMapper.updateById(any(PortalActivitySignup.class))).thenReturn(1);

        service.checkin(1L, 5L);

        assertThat(signup.getStatus()).isEqualTo(2);
    }

    @Test
    void checkin_wrongActivity_throwsBizException() {
        PortalActivitySignup signup = new PortalActivitySignup();
        signup.setId(5L);
        signup.setActivityId(99L);   // 不属于活动 1
        signup.setStatus(1);

        when(signupMapper.selectById(5L)).thenReturn(signup);

        assertThatThrownBy(() -> service.checkin(1L, 5L))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("报名记录不存在");
    }
}
