package com.greenlink.glmatch.service;

import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.Result;
import com.greenlink.glmatch.domain.MatchRecord;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import com.greenlink.glmatch.dto.request.MatchApplyRequest;
import com.greenlink.glmatch.dto.response.MatchApplyVO;
import com.greenlink.glmatch.feign.SupplyClient;
import com.greenlink.glmatch.mq.MatchEventProducer;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import com.greenlink.glmatch.service.impl.MatchApplyServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * S5-05 单元测试：发起对接申请（5 个核心场景）
 */
@ExtendWith(MockitoExtension.class)
class MatchApplyServiceTest {

    @Mock
    private SupplyClient supplyClient;
    @Mock
    private MatchRecordMapper matchRecordMapper;
    @Mock
    private MatchEventProducer matchEventProducer;

    @InjectMocks
    private MatchApplyServiceImpl service;

    private static final Long ACCOUNT_ID = 10L;
    private static final Long MEMBER_A = 1L;  // 资源方
    private static final Long MEMBER_B = 2L;  // 需求方
    private static final Long RESOURCE_ID = 100L;
    private static final Long DEMAND_ID = 200L;

    private SupplyBriefDTO resourceBrief;
    private SupplyBriefDTO demandBrief;

    @BeforeEach
    void setUp() {
        resourceBrief = new SupplyBriefDTO();
        resourceBrief.setId(RESOURCE_ID);
        resourceBrief.setMemberId(MEMBER_A);
        resourceBrief.setAuditStatus(1);

        demandBrief = new SupplyBriefDTO();
        demandBrief.setId(DEMAND_ID);
        demandBrief.setMemberId(MEMBER_B);
        demandBrief.setAuditStatus(1);
    }

    @Test
    @DisplayName("场景1：正常申请 - 资源方发起，创建记录成功")
    void apply_success_resourceOwnerInitiates() {
        when(supplyClient.getResourceMatchBrief(RESOURCE_ID))
                .thenReturn(Result.ok(resourceBrief));
        when(supplyClient.getDemandMatchBrief(DEMAND_ID))
                .thenReturn(Result.ok(demandBrief));
        when(matchRecordMapper.existsActiveRecord(RESOURCE_ID, DEMAND_ID)).thenReturn(false);
        doReturn(1).when(matchRecordMapper).insert(any(MatchRecord.class));

        MatchApplyRequest req = new MatchApplyRequest();
        req.setResourceId(RESOURCE_ID);
        req.setDemandId(DEMAND_ID);
        req.setApplyMessage("期望合作");

        MatchApplyVO vo = service.apply(ACCOUNT_ID, MEMBER_A, req);

        assertThat(vo.getResourceId()).isEqualTo(RESOURCE_ID);
        assertThat(vo.getDemandId()).isEqualTo(DEMAND_ID);
        assertThat(vo.getStatus()).isEqualTo(1);
        assertThat(vo.getMatchType()).isEqualTo(2);
        assertThat(vo.getApplyMessage()).isEqualTo("期望合作");
        verify(matchRecordMapper).insert(any(MatchRecord.class));
    }

    @Test
    @DisplayName("场景2：正常申请 - 需求方发起，创建记录成功")
    void apply_success_demandOwnerInitiates() {
        when(supplyClient.getResourceMatchBrief(RESOURCE_ID))
                .thenReturn(Result.ok(resourceBrief));
        when(supplyClient.getDemandMatchBrief(DEMAND_ID))
                .thenReturn(Result.ok(demandBrief));
        when(matchRecordMapper.existsActiveRecord(RESOURCE_ID, DEMAND_ID)).thenReturn(false);
        doReturn(1).when(matchRecordMapper).insert(any(MatchRecord.class));

        MatchApplyRequest req = new MatchApplyRequest();
        req.setResourceId(RESOURCE_ID);
        req.setDemandId(DEMAND_ID);

        MatchApplyVO vo = service.apply(ACCOUNT_ID, MEMBER_B, req);

        assertThat(vo.getResourceMemberId()).isEqualTo(MEMBER_A);
        assertThat(vo.getDemandMemberId()).isEqualTo(MEMBER_B);
    }

    @Test
    @DisplayName("场景3：重复申请 - 返回 code:3102")
    void apply_duplicateActive_throws3102() {
        when(supplyClient.getResourceMatchBrief(RESOURCE_ID))
                .thenReturn(Result.ok(resourceBrief));
        when(supplyClient.getDemandMatchBrief(DEMAND_ID))
                .thenReturn(Result.ok(demandBrief));
        when(matchRecordMapper.existsActiveRecord(RESOURCE_ID, DEMAND_ID)).thenReturn(true);

        MatchApplyRequest req = new MatchApplyRequest();
        req.setResourceId(RESOURCE_ID);
        req.setDemandId(DEMAND_ID);

        assertThatThrownBy(() -> service.apply(ACCOUNT_ID, MEMBER_A, req))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode()).isEqualTo(3102));

        verify(matchRecordMapper, never()).insert(any(MatchRecord.class));
    }

    @Test
    @DisplayName("场景4：无权申请 - 非资源/需求归属方，返回 code:1003")
    void apply_notOwner_throws1003() {
        when(supplyClient.getResourceMatchBrief(RESOURCE_ID))
                .thenReturn(Result.ok(resourceBrief));
        when(supplyClient.getDemandMatchBrief(DEMAND_ID))
                .thenReturn(Result.ok(demandBrief));

        Long unrelatedMember = 99L;
        MatchApplyRequest req = new MatchApplyRequest();
        req.setResourceId(RESOURCE_ID);
        req.setDemandId(DEMAND_ID);

        assertThatThrownBy(() -> service.apply(ACCOUNT_ID, unrelatedMember, req))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode()).isEqualTo(1003));

        verify(matchRecordMapper, never()).insert(any(MatchRecord.class));
    }

    @Test
    @DisplayName("场景5：自对接防护 - 资源与需求属同一会员，返回 code:3101")
    void apply_selfApply_throws3101() {
        SupplyBriefDTO sameMemberDemand = new SupplyBriefDTO();
        sameMemberDemand.setId(DEMAND_ID);
        sameMemberDemand.setMemberId(MEMBER_A);  // 与 resource 同一会员
        sameMemberDemand.setAuditStatus(1);

        when(supplyClient.getResourceMatchBrief(RESOURCE_ID))
                .thenReturn(Result.ok(resourceBrief));
        when(supplyClient.getDemandMatchBrief(DEMAND_ID))
                .thenReturn(Result.ok(sameMemberDemand));

        MatchApplyRequest req = new MatchApplyRequest();
        req.setResourceId(RESOURCE_ID);
        req.setDemandId(DEMAND_ID);

        assertThatThrownBy(() -> service.apply(ACCOUNT_ID, MEMBER_A, req))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode()).isEqualTo(3101));

        verify(matchRecordMapper, never()).insert(any(MatchRecord.class));
    }
}
