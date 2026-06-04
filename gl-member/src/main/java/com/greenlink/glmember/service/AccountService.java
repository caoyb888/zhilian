package com.greenlink.glmember.service;

import com.greenlink.glmember.dto.request.AccountStatusRequest;
import com.greenlink.glmember.dto.request.CreateSubAccountRequest;
import com.greenlink.glmember.dto.response.AccountVO;

import java.util.List;

public interface AccountService {

    AccountVO createSubAccount(Long memberId, CreateSubAccountRequest request, Long requestingAccountId);

    List<AccountVO> listSubAccounts(Long memberId, Long requestingAccountId);

    void updateAccountStatus(Long memberId, Long accountId, AccountStatusRequest request,
                             Long requestingAccountId, String roles);
}
