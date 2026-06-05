package com.greenlink.glportal.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.glportal.dto.request.ActivityPageRequest;
import com.greenlink.glportal.dto.request.ActivitySignupRequest;
import com.greenlink.glportal.dto.request.CreateActivityRequest;
import com.greenlink.glportal.dto.request.SignupPageRequest;
import com.greenlink.glportal.dto.request.UpdateActivityRequest;
import com.greenlink.glportal.dto.response.ActivityDetailVO;
import com.greenlink.glportal.dto.response.ActivityVO;
import com.greenlink.glportal.dto.response.SignupVO;

public interface PortalActivityService {

    Page<ActivityVO> pageList(ActivityPageRequest request);

    ActivityDetailVO getById(Long id);

    ActivityDetailVO create(CreateActivityRequest request);

    ActivityDetailVO update(Long id, UpdateActivityRequest request);

    void delete(Long id);

    void updateStatus(Long id, Integer status);

    SignupVO signup(Long activityId, Long accountId, Long memberId, ActivitySignupRequest request);

    void cancelSignup(Long activityId, Long accountId);

    Page<SignupVO> listSignups(Long activityId, SignupPageRequest request);

    void checkin(Long activityId, Long signupId);
}
