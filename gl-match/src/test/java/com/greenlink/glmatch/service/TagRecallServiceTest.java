package com.greenlink.glmatch.service;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import com.greenlink.glmatch.dto.TagSimpleDTO;
import com.greenlink.glmatch.engine.recall.TagRecallCandidate;
import com.greenlink.glmatch.feign.SupplyClient;
import com.greenlink.glmatch.feign.TagClient;
import com.greenlink.glmatch.service.impl.TagRecallServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * S5-01 单元测试：标签精确召回（4 个核心场景）
 */
@ExtendWith(MockitoExtension.class)
class TagRecallServiceTest {

    @Mock
    TagClient tagClient;

    @Mock
    SupplyClient supplyClient;

    @InjectMocks
    TagRecallServiceImpl service;

    // ─────────────────────────────────────────────
    // 工厂方法
    // ─────────────────────────────────────────────

    private static TagSimpleDTO tag(long id, String name, String category) {
        TagSimpleDTO t = new TagSimpleDTO();
        t.setId(id);
        t.setName(name);
        t.setCategoryCode(category);
        return t;
    }

    private static SupplyBriefDTO brief(long id, long memberId, String province) {
        SupplyBriefDTO b = new SupplyBriefDTO();
        b.setId(id);
        b.setMemberId(memberId);
        b.setProvince(province);
        b.setAuditStatus(1);
        return b;
    }

    // ─────────────────────────────────────────────
    // TC-01  精确匹配：行业 + 技术标签全部命中
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-01 精确匹配：行业与技术标签全命中，tagScore = 2×2+1 = 5")
    void recall_fullMatch() {
        // 来源资源有 2 个行业标签 + 1 个技术标签
        TagSimpleDTO ind1 = tag(1L, "新能源", "INDUSTRY");
        TagSimpleDTO ind2 = tag(2L, "储能", "INDUSTRY");
        TagSimpleDTO tech = tag(3L, "光伏", "RESOURCE");

        when(tagClient.getByBiz("RESOURCE", 100L))
                .thenReturn(Result.ok(List.of(ind1, ind2, tech)));

        // 需求 ID=200 命中全部 3 个标签
        when(tagClient.getBizIdsByTagsBatch(anyList(), eq("DEMAND")))
                .thenReturn(Result.ok(Map.of(
                        1L, List.of(200L),
                        2L, List.of(200L),
                        3L, List.of(200L))));

        List<TagRecallCandidate> result = service.recall("RESOURCE", 100L, "DEMAND", null, 200);

        assertThat(result).hasSize(1);
        TagRecallCandidate c = result.get(0);
        assertThat(c.getCandidateId()).isEqualTo(200L);
        assertThat(c.getIndustryTagMatchCount()).isEqualTo(2);
        assertThat(c.getOtherTagMatchCount()).isEqualTo(1);
        assertThat(c.getTagScore()).isEqualTo(5);   // 2×2 + 1×1
        assertThat(c.getMatchedTagIds()).containsExactlyInAnyOrder(1L, 2L, 3L);
    }

    // ─────────────────────────────────────────────
    // TC-02  部分匹配：只命中 1 个行业标签
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-02 部分匹配：仅命中 1 个行业标签，must 约束满足，候选排在列表中")
    void recall_partialMatch() {
        TagSimpleDTO ind1 = tag(1L, "新能源", "INDUSTRY");
        TagSimpleDTO ind2 = tag(2L, "储能", "INDUSTRY");
        TagSimpleDTO tech = tag(3L, "光伏", "RESOURCE");

        when(tagClient.getByBiz("RESOURCE", 100L))
                .thenReturn(Result.ok(List.of(ind1, ind2, tech)));

        // 需求 200 只命中 ind1；需求 201 命中 ind1 + tech
        when(tagClient.getBizIdsByTagsBatch(anyList(), eq("DEMAND")))
                .thenReturn(Result.ok(Map.of(
                        1L, List.of(200L, 201L),
                        2L, List.of(201L),         // 200 未命中 ind2
                        3L, List.of(201L))));

        List<TagRecallCandidate> result = service.recall("RESOURCE", 100L, "DEMAND", null, 200);

        assertThat(result).hasSize(2);
        // 201 score=2+2+1=5；200 score=2
        assertThat(result.get(0).getCandidateId()).isEqualTo(201L);
        assertThat(result.get(0).getTagScore()).isEqualTo(5);
        assertThat(result.get(1).getCandidateId()).isEqualTo(200L);
        assertThat(result.get(1).getTagScore()).isEqualTo(2);
    }

    // ─────────────────────────────────────────────
    // TC-03  无匹配：来源有行业标签，但候选池无任何行业标签重叠
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-03 无匹配：must 行业标签零命中，返回空列表")
    void recall_noMatch_industryRequired() {
        TagSimpleDTO ind1 = tag(1L, "新能源", "INDUSTRY");

        when(tagClient.getByBiz("RESOURCE", 100L))
                .thenReturn(Result.ok(List.of(ind1)));

        // 行业标签对应的需求 ID 列表为空（无任何需求属于"新能源"行业）
        when(tagClient.getBizIdsByTagsBatch(anyList(), eq("DEMAND")))
                .thenReturn(Result.ok(Map.of(1L, Collections.emptyList())));

        List<TagRecallCandidate> result = service.recall("RESOURCE", 100L, "DEMAND", null, 200);

        assertThat(result).isEmpty();
    }

    // ─────────────────────────────────────────────
    // TC-04  省份过滤：filter 省份后只保留同省候选
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-04 省份过滤：非同省候选被 filter 过滤掉，同省候选保留")
    void recall_provinceFilter() {
        TagSimpleDTO ind1 = tag(1L, "新能源", "INDUSTRY");

        when(tagClient.getByBiz("RESOURCE", 100L))
                .thenReturn(Result.ok(List.of(ind1)));

        // 候选 200（山东省）、201（北京市）
        when(tagClient.getBizIdsByTagsBatch(anyList(), eq("DEMAND")))
                .thenReturn(Result.ok(Map.of(1L, List.of(200L, 201L))));

        when(supplyClient.batchBriefDemands(anyList()))
                .thenReturn(Result.ok(List.of(
                        brief(200L, 10L, "山东省"),
                        brief(201L, 11L, "北京市"))));

        List<TagRecallCandidate> result = service.recall("RESOURCE", 100L, "DEMAND", "山东省", 200);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCandidateId()).isEqualTo(200L);
        assertThat(result.get(0).getCandidateProvince()).isEqualTo("山东省");
    }
}
