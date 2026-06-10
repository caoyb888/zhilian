package com.greenlink.glmember.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.Result;
import com.greenlink.common.result.ResultCode;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmember.client.TagRelationClient;
import com.greenlink.glmember.client.dto.BatchSetTagRelationsRequest;
import com.greenlink.glmember.client.dto.TagSimpleVO;
import com.greenlink.glmember.domain.MemberAccount;
import com.greenlink.glmember.domain.MemberUnit;
import com.greenlink.glmember.domain.RbacAccountRole;
import com.greenlink.glmember.dto.request.AuditMemberRequest;
import com.greenlink.glmember.dto.request.RegisterRequest;
import com.greenlink.glmember.dto.request.UpdateMemberRequest;
import com.greenlink.glmember.dto.response.AdminAccountVO;
import com.greenlink.glmember.dto.response.MemberBriefVO;
import com.greenlink.glmember.dto.response.MemberDetailVO;
import com.greenlink.glmember.dto.response.MemberMeVO;
import com.greenlink.glmember.dto.response.MemberVO;
import com.greenlink.glmember.dto.response.RegisterResponse;
import com.greenlink.glmember.repository.MemberAccountMapper;
import com.greenlink.glmember.repository.MemberUnitMapper;
import com.greenlink.glmember.repository.RbacAccountRoleMapper;
import com.greenlink.glmember.repository.RbacPermissionMapper;
import com.greenlink.glmember.repository.RbacRoleMapper;
import com.greenlink.glmember.service.MemberService;
import com.greenlink.glmember.util.MaskUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private static final int STATUS_PENDING = 2;
    private static final int STATUS_ACTIVE = 1;
    private static final String BIZ_TYPE_MEMBER = "MEMBER";

    private final MemberUnitMapper memberUnitMapper;
    private final MemberAccountMapper accountMapper;
    private final RbacRoleMapper rbacRoleMapper;
    private final RbacAccountRoleMapper rbacAccountRoleMapper;
    private final RbacPermissionMapper rbacPermissionMapper;
    private final TagRelationClient tagRelationClient;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public RegisterResponse register(RegisterRequest request) {
        validateSmsCode(request.getPhone(), request.getSmsCode());
        checkUsernameUnique(request.getUsername());
        checkPhoneUnique(request.getPhone());

        MemberUnit unit = buildMemberUnit(request);
        memberUnitMapper.insert(unit);

        MemberAccount mainAccount = buildMainAccount(unit.getId(), request);
        accountMapper.insert(mainAccount);

        Long memberRoleId = rbacRoleMapper.findIdByCode("MEMBER");
        if (memberRoleId != null) {
            RbacAccountRole accountRole = RbacAccountRole.builder()
                    .accountId(mainAccount.getId())
                    .roleId(memberRoleId)
                    .createdAt(LocalDateTime.now())
                    .build();
            rbacAccountRoleMapper.insert(accountRole);
        }

        if (!CollectionUtils.isEmpty(request.getTagIds())) {
            try {
                tagRelationClient.batchSet(
                        new BatchSetTagRelationsRequest(BIZ_TYPE_MEMBER, unit.getId(), request.getTagIds()));
            } catch (Exception e) {
                log.warn("标签关联设置失败，注册流程继续 memberId={}", unit.getId(), e);
            }
        }

        return RegisterResponse.builder()
                .memberId(unit.getId())
                .memberStatus(STATUS_PENDING)
                .accountId(mainAccount.getId())
                .build();
    }

    @Override
    public PageResult<MemberVO> listMembers(int page, int size, String keyword,
                                            String industry, String province,
                                            Integer memberLevel, Integer status) {
        QueryWrapper<MemberUnit> wrapper = new QueryWrapper<MemberUnit>()
                .select("id", "name", "short_name", "industry", "province", "city",
                        "member_level", "logo_url", "is_certified", "status",
                        "created_at", "updated_at")
                .like(StringUtils.hasText(keyword), "name", keyword)
                .eq(StringUtils.hasText(industry), "industry", industry)
                .eq(StringUtils.hasText(province), "province", province)
                .eq(memberLevel != null, "member_level", memberLevel)
                .eq(status != null, "status", status)
                .orderByDesc("created_at");

        Page<MemberUnit> iPage = memberUnitMapper.selectPage(new Page<>(page, size), wrapper);

        List<MemberVO> records = iPage.getRecords().stream()
                .map(this::toMemberVO)
                .collect(Collectors.toList());

        return PageResult.of(records, iPage.getTotal(), page, size);
    }

    @Override
    public MemberDetailVO getDetail(Long memberId, Long requestingAccountId) {
        MemberUnit unit = memberUnitMapper.selectById(memberId);
        if (unit == null) {
            throw new BizException(ResultCode.MEMBER_NOT_FOUND);
        }

        boolean isLoggedIn = requestingAccountId != null;
        boolean isOwnUnit = false;
        if (isLoggedIn) {
            MemberAccount account = accountMapper.selectById(requestingAccountId);
            isOwnUnit = account != null && memberId.equals(account.getMemberId());
        }

        return toMemberDetailVO(unit, isLoggedIn || isOwnUnit);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateMember(Long memberId, UpdateMemberRequest request,
                             Long requestingAccountId, String roles) {
        MemberUnit unit = memberUnitMapper.selectById(memberId);
        if (unit == null) {
            throw new BizException(ResultCode.MEMBER_NOT_FOUND);
        }

        checkUpdatePermission(memberId, requestingAccountId, roles);

        if (StringUtils.hasText(request.getShortName())) unit.setShortName(request.getShortName());
        if (StringUtils.hasText(request.getIndustry())) unit.setIndustry(request.getIndustry());
        if (StringUtils.hasText(request.getProvince())) unit.setProvince(request.getProvince());
        if (StringUtils.hasText(request.getCity())) unit.setCity(request.getCity());
        if (StringUtils.hasText(request.getIntroduction())) unit.setIntroduction(request.getIntroduction());
        if (StringUtils.hasText(request.getContactName())) unit.setContactName(request.getContactName());
        if (StringUtils.hasText(request.getContactPhone())) unit.setContactPhone(request.getContactPhone());
        if (StringUtils.hasText(request.getContactEmail())) unit.setContactEmail(request.getContactEmail());
        if (StringUtils.hasText(request.getLogoUrl())) unit.setLogoUrl(request.getLogoUrl());
        unit.setUpdatedAt(LocalDateTime.now());
        memberUnitMapper.updateById(unit);

        if (request.getTagIds() != null) {
            try {
                tagRelationClient.batchSet(
                        new BatchSetTagRelationsRequest(BIZ_TYPE_MEMBER, memberId, request.getTagIds()));
            } catch (Exception e) {
                log.warn("标签关联更新失败 memberId={}", memberId, e);
            }
        }
    }

    @Override
    public MemberMeVO getMe(Long accountId) {
        MemberAccount account = accountMapper.selectById(accountId);
        if (account == null) {
            throw new BizException(ResultCode.USER_NOT_FOUND, "账号不存在");
        }

        MemberUnit unit = memberUnitMapper.selectById(account.getMemberId());
        List<String> roles = rbacRoleMapper.findRoleCodesByAccountId(accountId);
        List<String> permissions = rbacPermissionMapper.findPermissionCodesByAccountId(accountId);

        boolean isMainAccount = account.getParentId() == null;

        MemberMeVO.MemberSummary memberSummary = unit != null
                ? MemberMeVO.MemberSummary.builder()
                        .id(unit.getId())
                        .name(unit.getName())
                        .memberLevel(unit.getMemberLevel())
                        .status(unit.getStatus())
                        .build()
                : null;

        return MemberMeVO.builder()
                .accountId(accountId)
                .username(account.getUsername())
                .realName(account.getRealName())
                .phone(MaskUtil.maskPhone(account.getPhone()))
                .email(MaskUtil.maskEmail(account.getEmail()))
                .avatarUrl(account.getAvatarUrl())
                .roles(roles)
                .permissions(permissions)
                .member(memberSummary)
                .isMainAccount(isMainAccount)
                .lastLoginAt(account.getLastLoginAt())
                .build();
    }

    // -------------------- private helpers --------------------

    private MemberVO toMemberVO(MemberUnit unit) {
        MemberVO vo = new MemberVO();
        vo.setId(unit.getId());
        vo.setName(unit.getName());
        vo.setShortName(unit.getShortName());
        vo.setIndustry(unit.getIndustry());
        vo.setMemberLevel(unit.getMemberLevel());
        vo.setMemberLevelName(MaskUtil.memberLevelName(unit.getMemberLevel()));
        vo.setProvince(unit.getProvince());
        vo.setCity(unit.getCity());
        vo.setLogoUrl(unit.getLogoUrl());
        vo.setIsCertified(unit.getIsCertified() != null && unit.getIsCertified() == 1);
        vo.setStatus(unit.getStatus());
        vo.setCreatedAt(unit.getCreatedAt());
        vo.setTags(fetchTags(unit.getId()));
        return vo;
    }

    private MemberDetailVO toMemberDetailVO(MemberUnit unit, boolean showContact) {
        MemberDetailVO vo = new MemberDetailVO();
        vo.setId(unit.getId());
        vo.setName(unit.getName());
        vo.setShortName(unit.getShortName());
        vo.setIndustry(unit.getIndustry());
        vo.setMemberLevel(unit.getMemberLevel());
        vo.setMemberLevelName(MaskUtil.memberLevelName(unit.getMemberLevel()));
        vo.setProvince(unit.getProvince());
        vo.setCity(unit.getCity());
        vo.setLogoUrl(unit.getLogoUrl());
        vo.setIsCertified(unit.getIsCertified() != null && unit.getIsCertified() == 1);
        vo.setStatus(unit.getStatus());
        vo.setCreatedAt(unit.getCreatedAt());
        vo.setIntroduction(unit.getIntroduction());
        vo.setJoinDate(unit.getJoinDate() != null ? unit.getJoinDate().toString() : null);

        if (showContact) {
            vo.setContactName(unit.getContactName());
            vo.setContactPhone(unit.getContactPhone());
            vo.setContactEmail(unit.getContactEmail());
        } else {
            vo.setContactName(MaskUtil.maskName(unit.getContactName()));
            vo.setContactPhone(MaskUtil.maskPhone(unit.getContactPhone()));
            vo.setContactEmail(MaskUtil.maskEmail(unit.getContactEmail()));
        }

        vo.setTags(fetchTags(unit.getId()));
        return vo;
    }

    private List<MemberVO.TagItem> fetchTags(Long memberId) {
        try {
            Result<List<TagSimpleVO>> result = tagRelationClient.getTagsByBiz(BIZ_TYPE_MEMBER, memberId);
            if (result != null && result.getData() != null) {
                return result.getData().stream()
                        .map(t -> new MemberVO.TagItem(t.getId(), t.getName(), t.getCategoryCode()))
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.warn("获取标签失败，返回空列表 memberId={}", memberId, e);
        }
        return List.of();
    }

    private MemberUnit buildMemberUnit(RegisterRequest request) {
        MemberUnit unit = new MemberUnit();
        unit.setName(request.getName());
        unit.setShortName(request.getShortName());
        unit.setIndustry(request.getIndustry());
        unit.setProvince(request.getProvince());
        unit.setCity(request.getCity());
        unit.setIntroduction(request.getIntroduction());
        unit.setContactName(request.getContactName());
        unit.setContactPhone(request.getPhone());
        unit.setContactEmail(request.getEmail());
        unit.setMemberLevel(1);
        unit.setStatus(STATUS_PENDING);
        unit.setIsCertified(0);
        unit.setIsDeleted(0);
        unit.setCreatedAt(LocalDateTime.now());
        unit.setUpdatedAt(LocalDateTime.now());
        return unit;
    }

    private MemberAccount buildMainAccount(Long memberId, RegisterRequest request) {
        MemberAccount account = new MemberAccount();
        account.setMemberId(memberId);
        account.setUsername(request.getUsername());
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        account.setPhone(request.getPhone());
        account.setEmail(request.getEmail());
        account.setStatus(STATUS_ACTIVE);
        account.setFailCount(0);
        account.setIsDeleted(0);
        account.setCreatedAt(LocalDateTime.now());
        account.setUpdatedAt(LocalDateTime.now());
        return account;
    }

    private void checkUsernameUnique(String username) {
        if (accountMapper.findByUsername(username) != null) {
            throw new BizException(ResultCode.USERNAME_EXISTS, "用户名已被占用");
        }
    }

    private void checkPhoneUnique(String phone) {
        if (accountMapper.findByPhone(phone) != null) {
            throw new BizException(ResultCode.PHONE_EXISTS, "该手机号已被注册");
        }
    }

    private void validateSmsCode(String phone, String smsCode) {
        String key = "auth:sms:REGISTER:" + phone;
        String stored = redisTemplate.opsForValue().get(key);
        if (stored == null || !stored.equals(smsCode)) {
            throw new BizException(ResultCode.SMS_CODE_INVALID, "短信验证码错误或已过期");
        }
        redisTemplate.delete(key);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void auditMember(Long memberId, AuditMemberRequest request, Long auditorId) {
        MemberUnit unit = memberUnitMapper.selectById(memberId);
        if (unit == null) {
            throw new BizException(ResultCode.MEMBER_NOT_FOUND);
        }
        if (unit.getStatus() != STATUS_PENDING) {
            throw new BizException(ResultCode.PARAM_ERROR, "该会员不在待审核状态，无法审核");
        }
        int newStatus = "APPROVE".equals(request.getAction()) ? STATUS_ACTIVE : 0;
        unit.setStatus(newStatus);
        if (newStatus == STATUS_ACTIVE && unit.getJoinDate() == null) {
            unit.setJoinDate(java.time.LocalDate.now());
        }
        unit.setUpdatedAt(LocalDateTime.now());
        memberUnitMapper.updateById(unit);
        log.info("会员审核完成: memberId={}, action={}, auditorId={}, remark={}",
                memberId, request.getAction(), auditorId, request.getRemark());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateMemberStatus(Long memberId, int status) {
        MemberUnit unit = memberUnitMapper.selectById(memberId);
        if (unit == null) {
            throw new BizException(ResultCode.MEMBER_NOT_FOUND);
        }
        unit.setStatus(status);
        unit.setUpdatedAt(LocalDateTime.now());
        memberUnitMapper.updateById(unit);
        log.info("管理端更新会员状态: memberId={}, status={}", memberId, status);
    }

    @Override
    public PageResult<AdminAccountVO> listAllAccounts(int page, int size,
                                                      Long memberId, Integer status, String keyword) {
        var iPage = accountMapper.pageAllAccounts(new Page<>(page, size), memberId, status, keyword);
        List<AdminAccountVO> records = iPage.getRecords().stream().map(acc -> {
            MemberUnit unit = memberUnitMapper.selectById(acc.getMemberId());
            return AdminAccountVO.builder()
                    .id(acc.getId())
                    .memberId(acc.getMemberId())
                    .memberName(unit != null ? unit.getName() : null)
                    .parentId(acc.getParentId())
                    .username(acc.getUsername())
                    .realName(acc.getRealName())
                    .phone(MaskUtil.maskPhone(acc.getPhone()))
                    .status(acc.getStatus())
                    .roles(rbacRoleMapper.findRoleCodesByAccountId(acc.getId()))
                    .lastLoginAt(acc.getLastLoginAt())
                    .createdAt(acc.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
        return PageResult.of(records, iPage.getTotal(), page, size);
    }

    @Override
    public List<MemberBriefVO> batchBrief(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return java.util.Collections.emptyList();
        return memberUnitMapper.selectBatchIds(ids).stream()
                .map(u -> {
                    MemberBriefVO vo = new MemberBriefVO();
                    vo.setId(u.getId());
                    vo.setName(u.getName());
                    vo.setMemberLevel(u.getMemberLevel());
                    vo.setProvince(u.getProvince());
                    return vo;
                }).collect(Collectors.toList());
    }

    @Override
    public java.util.Map<Long, Long> getMainAccountIdMap(List<Long> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) return java.util.Collections.emptyMap();
        return accountMapper.findMainAccountsByMemberIds(memberIds).stream()
                .collect(Collectors.toMap(
                        com.greenlink.glmember.domain.MemberAccount::getMemberId,
                        com.greenlink.glmember.domain.MemberAccount::getId,
                        (a, b) -> a));
    }

    @Override
    public com.greenlink.glmember.dto.response.MemberStatsVO getStats() {
        java.time.LocalDateTime monthStart = java.time.LocalDate.now()
                .withDayOfMonth(1).atStartOfDay();

        long total = memberUnitMapper.selectCount(
                new QueryWrapper<MemberUnit>().eq("status", 1));
        long newThisMonth = memberUnitMapper.selectCount(
                new QueryWrapper<MemberUnit>().ge("created_at", monthStart));

        com.greenlink.glmember.dto.response.MemberStatsVO vo =
                new com.greenlink.glmember.dto.response.MemberStatsVO();
        vo.setTotalMembers(total);
        vo.setNewMembersThisMonth(newThisMonth);
        return vo;
    }

    @Override
    public com.greenlink.glmember.dto.response.MemberDetailStatsVO getMemberDetailStats() {
        java.time.LocalDateTime monthStart = java.time.LocalDate.now()
                .withDayOfMonth(1).atStartOfDay();

        long total = memberUnitMapper.selectCount(
                new QueryWrapper<MemberUnit>().eq("status", 1));
        long newThisMonth = memberUnitMapper.selectCount(
                new QueryWrapper<MemberUnit>().ge("created_at", monthStart));

        java.util.List<com.greenlink.glmember.dto.response.IndustryDistVO> dist =
                memberUnitMapper.countByIndustry().stream()
                        .map(row -> {
                            String ind = (String) row.get("industry");
                            Number cnt = (Number) row.get("cnt");
                            return new com.greenlink.glmember.dto.response.IndustryDistVO(
                                    ind, cnt == null ? 0L : cnt.longValue());
                        })
                        .collect(Collectors.toList());

        com.greenlink.glmember.dto.response.MemberDetailStatsVO vo =
                new com.greenlink.glmember.dto.response.MemberDetailStatsVO();
        vo.setTotalMembers(total);
        vo.setNewMembersThisMonth(newThisMonth);
        vo.setIndustryDistribution(dist);
        return vo;
    }

    private void checkUpdatePermission(Long memberId, Long requestingAccountId, String roles) {
        boolean isAdmin = roles != null &&
                (roles.contains("SUPER_ADMIN") || roles.contains("CONTENT_ADMIN"));
        if (!isAdmin) {
            MemberAccount requester = accountMapper.selectById(requestingAccountId);
            if (requester == null || !memberId.equals(requester.getMemberId())) {
                throw new BizException(ResultCode.PERMISSION_DENIED, "无权修改该会员单位信息");
            }
        }
    }
}
