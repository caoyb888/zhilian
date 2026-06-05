package com.greenlink.glportal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glportal.domain.PortalActivity;
import com.greenlink.glportal.domain.PortalActivitySignup;
import com.greenlink.glportal.dto.request.ActivityPageRequest;
import com.greenlink.glportal.dto.request.ActivitySignupRequest;
import com.greenlink.glportal.dto.request.CreateActivityRequest;
import com.greenlink.glportal.dto.request.SignupPageRequest;
import com.greenlink.glportal.dto.request.UpdateActivityRequest;
import com.greenlink.glportal.dto.response.ActivityDetailVO;
import com.greenlink.glportal.dto.response.ActivityVO;
import com.greenlink.glportal.dto.response.SignupVO;
import com.greenlink.glportal.helper.SignupLockHelper;
import com.greenlink.glportal.repository.PortalActivityMapper;
import com.greenlink.glportal.repository.PortalActivitySignupMapper;
import com.greenlink.glportal.service.PortalActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortalActivityServiceImpl implements PortalActivityService {

    private final PortalActivityMapper activityMapper;
    private final PortalActivitySignupMapper signupMapper;
    private final SignupLockHelper lockHelper;

    // ─── 活动 CRUD ───────────────────────────────────────────────────────────

    @Override
    public Page<ActivityVO> pageList(ActivityPageRequest request) {
        LambdaQueryWrapper<PortalActivity> wrapper = new LambdaQueryWrapper<PortalActivity>()
                .eq(request.getStatus() != null, PortalActivity::getStatus, request.getStatus())
                .orderByDesc(PortalActivity::getCreatedAt);
        Page<PortalActivity> dbPage = activityMapper.selectPage(
                new Page<>(request.getPage(), request.getSize()), wrapper);
        Page<ActivityVO> voPage = new Page<>(dbPage.getCurrent(), dbPage.getSize(), dbPage.getTotal());
        voPage.setRecords(dbPage.getRecords().stream().map(this::toVO).toList());
        return voPage;
    }

    @Override
    public ActivityDetailVO getById(Long id) {
        PortalActivity activity = activityMapper.selectById(id);
        if (activity == null) {
            throw new BizException(ResultCode.ACTIVITY_NOT_FOUND);
        }
        return toDetailVO(activity);
    }

    @Override
    @Transactional
    public ActivityDetailVO create(CreateActivityRequest request) {
        PortalActivity activity = new PortalActivity();
        activity.setTitle(request.getTitle());
        activity.setContent(request.getContent());
        activity.setCoverUrl(request.getCoverUrl());
        activity.setLocation(request.getLocation());
        activity.setStartTime(request.getStartTime());
        activity.setEndTime(request.getEndTime());
        activity.setRegDeadline(request.getRegDeadline());
        activity.setMaxCapacity(request.getMaxCapacity());
        activity.setRegCount(0);
        activity.setStatus(request.getStatus() != null ? request.getStatus() : 1);
        activityMapper.insert(activity);
        log.info("创建活动 id={}", activity.getId());
        return toDetailVO(activity);
    }

    @Override
    @Transactional
    public ActivityDetailVO update(Long id, UpdateActivityRequest request) {
        PortalActivity activity = activityMapper.selectById(id);
        if (activity == null) {
            throw new BizException(ResultCode.ACTIVITY_NOT_FOUND);
        }
        if (request.getTitle() != null) activity.setTitle(request.getTitle());
        if (request.getContent() != null) activity.setContent(request.getContent());
        if (request.getCoverUrl() != null) activity.setCoverUrl(request.getCoverUrl());
        if (request.getLocation() != null) activity.setLocation(request.getLocation());
        if (request.getStartTime() != null) activity.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) activity.setEndTime(request.getEndTime());
        if (request.getRegDeadline() != null) activity.setRegDeadline(request.getRegDeadline());
        if (request.getMaxCapacity() != null) activity.setMaxCapacity(request.getMaxCapacity());
        activityMapper.updateById(activity);
        log.info("更新活动 id={}", id);
        return toDetailVO(activity);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        PortalActivity activity = activityMapper.selectById(id);
        if (activity == null) {
            throw new BizException(ResultCode.ACTIVITY_NOT_FOUND);
        }
        activityMapper.deleteById(id);
        log.info("删除活动 id={}", id);
    }

    @Override
    @Transactional
    public void updateStatus(Long id, Integer status) {
        PortalActivity activity = activityMapper.selectById(id);
        if (activity == null) {
            throw new BizException(ResultCode.ACTIVITY_NOT_FOUND);
        }
        activity.setStatus(status);
        activityMapper.updateById(activity);
        log.info("活动状态变更 id={} status={}", id, status);
    }

    // ─── 报名 ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public SignupVO signup(Long activityId, Long accountId, Long memberId, ActivitySignupRequest request) {
        // 前置校验 1：登录
        if (accountId == null) {
            throw new BizException(ResultCode.UNAUTHORIZED);
        }

        PortalActivity activity = activityMapper.selectById(activityId);

        // 前置校验 2：活动存在
        if (activity == null) {
            throw new BizException(ResultCode.ACTIVITY_NOT_FOUND);
        }

        // 前置校验 3：活动状态必须为"报名中"(2)
        if (activity.getStatus() != 2) {
            throw new BizException(ResultCode.ACTIVITY_STATUS_NOT_OPEN);
        }

        // 前置校验 4：报名截止
        if (activity.getRegDeadline() != null && LocalDateTime.now().isAfter(activity.getRegDeadline())) {
            throw new BizException(ResultCode.ACTIVITY_CLOSED);
        }

        // 前置校验 5：重复报名
        if (signupMapper.countByActivityAndAccount(activityId, accountId) > 0) {
            throw new BizException(ResultCode.SIGNUP_DUPLICATE);
        }

        // 获取 Redis 分布式锁，防止并发超卖
        if (!lockHelper.tryLock(activityId)) {
            throw new BizException(ResultCode.TOO_MANY_REQUESTS);
        }

        try {
            // 锁内二次检查容量（防止 pre-check 通过后名额被抢走）
            PortalActivity fresh = activityMapper.selectById(activityId);
            if (fresh.getMaxCapacity() != null && fresh.getRegCount() >= fresh.getMaxCapacity()) {
                throw new BizException(ResultCode.ACTIVITY_FULL);
            }

            // 插入报名记录
            PortalActivitySignup signup = new PortalActivitySignup();
            signup.setActivityId(activityId);
            signup.setAccountId(accountId);
            signup.setMemberId(memberId != null ? memberId : 0L);
            signup.setRemark(request != null ? request.getRemark() : null);
            signup.setStatus(1);
            signupMapper.insert(signup);

            // 原子递增 reg_count（DB 级最终防线）
            int rows = activityMapper.incrementRegCount(activityId);
            if (rows == 0) {
                throw new BizException(ResultCode.ACTIVITY_FULL);
            }

            log.info("活动报名成功 activityId={} accountId={}", activityId, accountId);
            return toSignupVO(signup);

        } finally {
            lockHelper.releaseLock(activityId);
        }
    }

    @Override
    @Transactional
    public void cancelSignup(Long activityId, Long accountId) {
        if (accountId == null) {
            throw new BizException(ResultCode.UNAUTHORIZED);
        }
        Long signupId = signupMapper.findIdByActivityAndAccount(activityId, accountId);
        if (signupId == null) {
            throw new BizException(ResultCode.NOT_FOUND, "未找到报名记录");
        }
        PortalActivitySignup signup = signupMapper.selectById(signupId);
        if (signup.getStatus() == 3) {
            throw new BizException(ResultCode.PARAM_ERROR, "报名已取消，无需重复操作");
        }
        if (signup.getStatus() == 2) {
            throw new BizException(ResultCode.PARAM_ERROR, "已签到，无法取消报名");
        }
        signup.setStatus(3);
        signupMapper.updateById(signup);
        activityMapper.decrementRegCount(activityId);
        log.info("取消报名 activityId={} accountId={}", activityId, accountId);
    }

    @Override
    public Page<SignupVO> listSignups(Long activityId, SignupPageRequest request) {
        LambdaQueryWrapper<PortalActivitySignup> wrapper = new LambdaQueryWrapper<PortalActivitySignup>()
                .eq(PortalActivitySignup::getActivityId, activityId)
                .eq(request.getStatus() != null, PortalActivitySignup::getStatus, request.getStatus())
                .orderByAsc(PortalActivitySignup::getCreatedAt);
        Page<PortalActivitySignup> dbPage = signupMapper.selectPage(
                new Page<>(request.getPage(), request.getSize()), wrapper);
        Page<SignupVO> voPage = new Page<>(dbPage.getCurrent(), dbPage.getSize(), dbPage.getTotal());
        voPage.setRecords(dbPage.getRecords().stream().map(this::toSignupVO).toList());
        return voPage;
    }

    @Override
    @Transactional
    public void checkin(Long activityId, Long signupId) {
        PortalActivitySignup signup = signupMapper.selectById(signupId);
        if (signup == null || !signup.getActivityId().equals(activityId)) {
            throw new BizException(ResultCode.NOT_FOUND, "报名记录不存在");
        }
        if (signup.getStatus() != 1) {
            throw new BizException(ResultCode.PARAM_ERROR, "当前状态不允许签到");
        }
        signup.setStatus(2);
        signupMapper.updateById(signup);
        log.info("签到成功 signupId={} activityId={}", signupId, activityId);
    }

    // ─── 转换 ─────────────────────────────────────────────────────────────────

    private ActivityVO toVO(PortalActivity a) {
        ActivityVO vo = new ActivityVO();
        vo.setId(a.getId());
        vo.setTitle(a.getTitle());
        vo.setCoverUrl(a.getCoverUrl());
        vo.setLocation(a.getLocation());
        vo.setStartTime(a.getStartTime());
        vo.setEndTime(a.getEndTime());
        vo.setRegDeadline(a.getRegDeadline());
        vo.setMaxCapacity(a.getMaxCapacity());
        vo.setRegCount(a.getRegCount());
        vo.setStatus(a.getStatus());
        vo.setCreatedAt(a.getCreatedAt());
        return vo;
    }

    private ActivityDetailVO toDetailVO(PortalActivity a) {
        ActivityDetailVO vo = new ActivityDetailVO();
        vo.setId(a.getId());
        vo.setTitle(a.getTitle());
        vo.setCoverUrl(a.getCoverUrl());
        vo.setLocation(a.getLocation());
        vo.setStartTime(a.getStartTime());
        vo.setEndTime(a.getEndTime());
        vo.setRegDeadline(a.getRegDeadline());
        vo.setMaxCapacity(a.getMaxCapacity());
        vo.setRegCount(a.getRegCount() != null ? a.getRegCount() : 0);
        vo.setStatus(a.getStatus());
        vo.setCreatedAt(a.getCreatedAt());
        vo.setContent(a.getContent());
        return vo;
    }

    private SignupVO toSignupVO(PortalActivitySignup s) {
        SignupVO vo = new SignupVO();
        vo.setId(s.getId());
        vo.setActivityId(s.getActivityId());
        vo.setAccountId(s.getAccountId());
        vo.setMemberId(s.getMemberId());
        vo.setRemark(s.getRemark());
        vo.setStatus(s.getStatus());
        vo.setCreatedAt(s.getCreatedAt());
        return vo;
    }
}
