package com.greenlink.glmember.service;

import com.greenlink.common.util.PageResult;
import com.greenlink.glmember.dto.request.RegisterRequest;
import com.greenlink.glmember.dto.request.UpdateMemberRequest;
import com.greenlink.glmember.dto.response.MemberDetailVO;
import com.greenlink.glmember.dto.response.MemberMeVO;
import com.greenlink.glmember.dto.response.MemberVO;
import com.greenlink.glmember.dto.response.RegisterResponse;

public interface MemberService {

    RegisterResponse register(RegisterRequest request);

    PageResult<MemberVO> listMembers(int page, int size, String keyword,
                                     String industry, String province,
                                     Integer memberLevel, Integer status);

    MemberDetailVO getDetail(Long memberId, Long requestingAccountId);

    void updateMember(Long memberId, UpdateMemberRequest request,
                      Long requestingAccountId, String roles);

    MemberMeVO getMe(Long accountId);
}
