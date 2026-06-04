package com.greenlink.glmember.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glmember.domain.MemberAccount;
import com.greenlink.glmember.domain.MemberUnit;
import com.greenlink.glmember.domain.RbacAccountRole;
import com.greenlink.glmember.dto.request.AccountStatusRequest;
import com.greenlink.glmember.dto.request.CreateSubAccountRequest;
import com.greenlink.glmember.dto.response.AccountVO;
import com.greenlink.glmember.repository.MemberAccountMapper;
import com.greenlink.glmember.repository.MemberUnitMapper;
import com.greenlink.glmember.repository.RbacAccountRoleMapper;
import com.greenlink.glmember.repository.RbacRoleMapper;
import com.greenlink.glmember.service.AccountService;
import com.greenlink.glmember.util.MaskUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final MemberAccountMapper accountMapper;
    private final MemberUnitMapper memberUnitMapper;
    private final RbacRoleMapper rbacRoleMapper;
    private final RbacAccountRoleMapper rbacAccountRoleMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AccountVO createSubAccount(Long memberId, CreateSubAccountRequest request,
                                      Long requestingAccountId) {
        MemberUnit unit = memberUnitMapper.selectById(memberId);
        if (unit == null) {
            throw new BizException(ResultCode.MEMBER_NOT_FOUND);
        }
        checkMainAccountPermission(memberId, requestingAccountId);

        if (accountMapper.findByUsername(request.getUsername()) != null) {
            throw new BizException(ResultCode.USERNAME_EXISTS, "用户名已被占用");
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()
                && accountMapper.findByPhone(request.getPhone()) != null) {
            throw new BizException(ResultCode.PHONE_EXISTS, "该手机号已被注册");
        }

        MemberAccount subAccount = new MemberAccount();
        subAccount.setMemberId(memberId);
        subAccount.setParentId(requestingAccountId);
        subAccount.setUsername(request.getUsername());
        subAccount.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        subAccount.setPhone(request.getPhone());
        subAccount.setRealName(request.getRealName());
        subAccount.setStatus(1);
        subAccount.setFailCount(0);
        subAccount.setIsDeleted(0);
        subAccount.setCreatedAt(LocalDateTime.now());
        subAccount.setUpdatedAt(LocalDateTime.now());
        accountMapper.insert(subAccount);

        if (!CollectionUtils.isEmpty(request.getRoleIds())) {
            request.getRoleIds().forEach(roleId -> {
                RbacAccountRole ar = RbacAccountRole.builder()
                        .accountId(subAccount.getId())
                        .roleId(roleId)
                        .createdAt(LocalDateTime.now())
                        .build();
                rbacAccountRoleMapper.insert(ar);
            });
        }

        return toAccountVO(subAccount);
    }

    @Override
    public List<AccountVO> listSubAccounts(Long memberId, Long requestingAccountId) {
        MemberUnit unit = memberUnitMapper.selectById(memberId);
        if (unit == null) {
            throw new BizException(ResultCode.MEMBER_NOT_FOUND);
        }
        checkMemberAccess(memberId, requestingAccountId, null);

        return accountMapper.findSubAccountsByMemberId(memberId).stream()
                .map(this::toAccountVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateAccountStatus(Long memberId, Long accountId,
                                    AccountStatusRequest request,
                                    Long requestingAccountId, String roles) {
        MemberAccount target = accountMapper.selectById(accountId);
        if (target == null || !memberId.equals(target.getMemberId())) {
            throw new BizException(ResultCode.NOT_FOUND, "账号不存在");
        }
        checkMemberAccess(memberId, requestingAccountId, roles);

        accountMapper.update(null, new UpdateWrapper<MemberAccount>()
                .eq("id", accountId)
                .set("status", request.getStatus())
                .set("updated_at", LocalDateTime.now()));
    }

    // -------------------- private helpers --------------------

    private AccountVO toAccountVO(MemberAccount account) {
        AccountVO vo = new AccountVO();
        vo.setId(account.getId());
        vo.setMemberId(account.getMemberId());
        vo.setParentId(account.getParentId());
        vo.setUsername(account.getUsername());
        vo.setRealName(account.getRealName());
        vo.setPhone(MaskUtil.maskPhone(account.getPhone()));
        vo.setAvatarUrl(account.getAvatarUrl());
        vo.setStatus(account.getStatus());
        vo.setLastLoginAt(account.getLastLoginAt());
        vo.setCreatedAt(account.getCreatedAt());
        vo.setRoles(rbacRoleMapper.findRoleCodesByAccountId(account.getId()));
        return vo;
    }

    private void checkMainAccountPermission(Long memberId, Long requestingAccountId) {
        MemberAccount requester = accountMapper.selectById(requestingAccountId);
        if (requester == null || !memberId.equals(requester.getMemberId())
                || requester.getParentId() != null) {
            throw new BizException(ResultCode.PERMISSION_DENIED, "仅主账号可管理子账号");
        }
    }

    private void checkMemberAccess(Long memberId, Long requestingAccountId, String roles) {
        boolean isAdmin = roles != null && roles.contains("SUPER_ADMIN");
        if (!isAdmin) {
            MemberAccount requester = accountMapper.selectById(requestingAccountId);
            if (requester == null || !memberId.equals(requester.getMemberId())) {
                throw new BizException(ResultCode.PERMISSION_DENIED, "无权访问该会员账号");
            }
        }
    }
}
