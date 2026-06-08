package com.greenlink.glmatch.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.greenlink.common.result.Result;
import com.greenlink.common.util.PageResult;
import com.greenlink.glmatch.domain.MatchRecord;
import com.greenlink.glmatch.dto.MemberBriefDTO;
import com.greenlink.glmatch.dto.MatchUnreadCount;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import com.greenlink.glmatch.dto.response.MatchRecordItemVO;
import com.greenlink.glmatch.feign.MemberClient;
import com.greenlink.glmatch.feign.SupplyClient;
import com.greenlink.glmatch.repository.MatchMessageMapper;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import com.greenlink.glmatch.service.impl.MatchRecordListServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

/**
 * S5-08 单元测试：我的对接记录列表（4 个场景）
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MatchRecordListServiceTest {

    @Mock private MatchRecordMapper    matchRecordMapper;
    @Mock private MatchMessageMapper   matchMessageMapper;
    @Mock private SupplyClient         supplyClient;
    @Mock private MemberClient         memberClient;

    @InjectMocks
    private MatchRecordListServiceImpl service;

    private static final Long ACCOUNT_ID   = 10L;
    private static final Long MEMBER_A     = 1L;   // 资源方（调用方）
    private static final Long MEMBER_B     = 2L;   // 需求方（对方）

    private MatchRecord buildRecord(Long id, Long resourceMbr, Long demandMbr,
                                    Long initiator, int status) {
        MatchRecord r = new MatchRecord();
        r.setId(id);
        r.setResourceId(100L + id);
        r.setDemandId(200L + id);
        r.setResourceMemberId(resourceMbr);
        r.setDemandMemberId(demandMbr);
        r.setMatchScore(BigDecimal.valueOf(75));
        r.setMatchType(2);
        r.setStatus(status);
        r.setInitiatorId(initiator);
        r.setApplyMessage("申请留言");
        r.setCreatedAt(LocalDateTime.now());
        r.setUpdatedAt(LocalDateTime.now());
        return r;
    }

    @SuppressWarnings("unchecked")
    private void mockPage(List<MatchRecord> records) {
        Page<MatchRecord> mockPage = new Page<>(1, 10);
        mockPage.setRecords(records);
        mockPage.setTotal(records.size());
        doReturn(mockPage).when(matchRecordMapper)
                .selectPage(any(Page.class), any(QueryWrapper.class));
    }

    @BeforeEach
    void stubEnrichment() {
        // 默认 stub：标题、会员、未读数均返回空，避免 NPE
        when(supplyClient.batchBriefResources(anyList())).thenReturn(Result.ok(Collections.emptyList()));
        when(supplyClient.batchBriefDemands(anyList())).thenReturn(Result.ok(Collections.emptyList()));
        when(memberClient.batchBrief(anyList())).thenReturn(Result.ok(Collections.emptyList()));
        when(matchMessageMapper.countUnreadByMatchIds(anyLong(), anyList()))
                .thenReturn(Collections.emptyList());
    }

    @Test
    @DisplayName("场景1：查询结果为空时返回空列表")
    void listMyRecords_empty() {
        mockPage(Collections.emptyList());

        PageResult<MatchRecordItemVO> result =
                service.listMyRecords(ACCOUNT_ID, MEMBER_A, null, 1, 10);

        assertThat(result.getTotal()).isEqualTo(0);
        assertThat(result.getRecords()).isEmpty();
    }

    @Test
    @DisplayName("场景2：调用方是资源方，对方为需求方 counterparty 正确")
    void listMyRecords_asResourceOwner_counterpartyIsDemand() {
        MatchRecord r = buildRecord(1L, MEMBER_A, MEMBER_B, ACCOUNT_ID, 1);
        mockPage(List.of(r));

        MemberBriefDTO counterparty = new MemberBriefDTO();
        counterparty.setId(MEMBER_B);
        counterparty.setName("需求方公司");
        counterparty.setMemberLevel(1);
        when(memberClient.batchBrief(anyList())).thenReturn(Result.ok(List.of(counterparty)));

        PageResult<MatchRecordItemVO> result =
                service.listMyRecords(ACCOUNT_ID, MEMBER_A, null, 1, 10);

        MatchRecordItemVO item = result.getRecords().get(0);
        assertThat(item.getCounterparty().getMemberId()).isEqualTo(MEMBER_B);
        assertThat(item.getCounterparty().getName()).isEqualTo("需求方公司");
        assertThat(item.getIsInitiator()).isTrue();   // ACCOUNT_ID == initiatorId
        assertThat(item.getStatus()).isEqualTo(1);
    }

    @Test
    @DisplayName("场景3：调用方是需求方，对方为资源方 counterparty 正确，且 isInitiator=false")
    void listMyRecords_asDemandOwner_counterpartyIsResource() {
        // 资源方发起，需求方（MEMBER_B）来查
        MatchRecord r = buildRecord(2L, MEMBER_A, MEMBER_B, 99L /*他人发起*/, 2);
        mockPage(List.of(r));

        MemberBriefDTO counterparty = new MemberBriefDTO();
        counterparty.setId(MEMBER_A);
        counterparty.setName("资源方公司");
        counterparty.setMemberLevel(2);
        when(memberClient.batchBrief(anyList())).thenReturn(Result.ok(List.of(counterparty)));

        PageResult<MatchRecordItemVO> result =
                service.listMyRecords(ACCOUNT_ID, MEMBER_B, null, 1, 10);

        MatchRecordItemVO item = result.getRecords().get(0);
        assertThat(item.getCounterparty().getMemberId()).isEqualTo(MEMBER_A);
        assertThat(item.getIsInitiator()).isFalse();  // ACCOUNT_ID(10) != initiatorId(99)
    }

    @Test
    @DisplayName("场景4：未读数正确映射到对应记录")
    void listMyRecords_unreadCountMappedCorrectly() {
        MatchRecord r1 = buildRecord(10L, MEMBER_A, MEMBER_B, ACCOUNT_ID, 3);
        MatchRecord r2 = buildRecord(20L, MEMBER_A, MEMBER_B, ACCOUNT_ID, 3);
        mockPage(List.of(r1, r2));

        MatchUnreadCount u = new MatchUnreadCount();
        u.setMatchId(10L);
        u.setCnt(5);
        when(matchMessageMapper.countUnreadByMatchIds(anyLong(), anyList()))
                .thenReturn(List.of(u));

        PageResult<MatchRecordItemVO> result =
                service.listMyRecords(ACCOUNT_ID, MEMBER_A, null, 1, 10);

        assertThat(result.getRecords().get(0).getUnreadCount()).isEqualTo(5);
        assertThat(result.getRecords().get(1).getUnreadCount()).isEqualTo(0); // 无未读，默认0
    }
}
