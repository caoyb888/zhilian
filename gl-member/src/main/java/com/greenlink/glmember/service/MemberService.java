package com.greenlink.glmember.service;

import com.greenlink.common.util.PageResult;
import com.greenlink.glmember.dto.request.AuditMemberRequest;
import com.greenlink.glmember.dto.request.RegisterRequest;
import com.greenlink.glmember.dto.request.UpdateMemberRequest;
import com.greenlink.glmember.dto.response.AdminAccountVO;
import com.greenlink.glmember.dto.response.MemberBriefVO;
import com.greenlink.glmember.dto.response.MemberDetailVO;
import com.greenlink.glmember.dto.response.MemberMeVO;
import com.greenlink.glmember.dto.response.MemberVO;
import com.greenlink.glmember.dto.response.MemberStatsVO;
import com.greenlink.glmember.dto.response.RegisterResponse;

import java.util.List;
import java.util.Map;

public interface MemberService {

    RegisterResponse register(RegisterRequest request);

    PageResult<MemberVO> listMembers(int page, int size, String keyword,
                                     String industry, String province,
                                     Integer memberLevel, Integer status);

    MemberDetailVO getDetail(Long memberId, Long requestingAccountId);

    void updateMember(Long memberId, UpdateMemberRequest request,
                      Long requestingAccountId, String roles);

    MemberMeVO getMe(Long accountId);

    void auditMember(Long memberId, AuditMemberRequest request, Long auditorId);

    void updateMemberStatus(Long memberId, int status);

    PageResult<AdminAccountVO> listAllAccounts(int page, int size,
                                               Long memberId, Integer status, String keyword);

    /** 批量查询会员单位简要信息（id/name/memberLevel/province），供服务间 Feign 调用 */
    List<MemberBriefVO> batchBrief(List<Long> ids);

    /**
     * 批量查询各会员单位主账号ID（parent_id IS NULL, status=1），供内部服务调用。
     * key=memberId, value=accountId；无主账号的 memberId 不出现在 map 中。
     */
    Map<Long, Long> getMainAccountIdMap(List<Long> memberIds);

    /** 内部统计：总会员数（status=1）与本月新增数，供 gl-admin 看板聚合调用 */
    MemberStatsVO getStats();
}
