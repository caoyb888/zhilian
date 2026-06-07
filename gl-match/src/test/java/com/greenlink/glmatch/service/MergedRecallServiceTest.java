package com.greenlink.glmatch.service;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import com.greenlink.glmatch.engine.recall.EsRecallCandidate;
import com.greenlink.glmatch.engine.recall.MergedRecallCandidate;
import com.greenlink.glmatch.engine.recall.TagRecallCandidate;
import com.greenlink.glmatch.feign.SupplyClient;
import com.greenlink.glmatch.service.impl.MergedRecallServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * S5-02 单元测试：双路召回合并（T5-01-4）
 */
@ExtendWith(MockitoExtension.class)
class MergedRecallServiceTest {

    @Mock
    TagRecallService tagRecallService;

    @Mock
    EsRecallService esRecallService;

    @Mock
    SupplyClient supplyClient;

    @InjectMocks
    MergedRecallServiceImpl service;

    // ─────────────────────────────────────────────
    // TC-01  两路都命中同一候选 → 优先级最高，排在第一
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-01 两路同时命中的候选排在仅标签/仅ES候选前面")
    void merge_bothHit_prioritizedFirst() {
        mockSourceBrief("RESOURCE", 100L, "新能源光伏资源");

        // 候选 200：标签 + ES 都命中；候选 201：仅标签；候选 202：仅 ES
        when(tagRecallService.recall(anyString(), anyLong(), anyString(), any(), anyInt()))
                .thenReturn(List.of(
                        tagCandidate(200L, 2, 1),  // tagScore=5
                        tagCandidate(201L, 1, 0)   // tagScore=2
                ));
        when(esRecallService.recall(anyString(), anyString(), any(), anyInt()))
                .thenReturn(List.of(
                        new EsRecallCandidate(200L, 9.0f),  // 与标签重叠
                        new EsRecallCandidate(202L, 6.0f)   // 仅 ES
                ));

        List<MergedRecallCandidate> result = service.recall("RESOURCE", 100L, "DEMAND", null, 200);

        assertThat(result).hasSize(3);
        // 200 两路命中 → tier=1，排第一
        assertThat(result.get(0).getCandidateId()).isEqualTo(200L);
        assertThat(result.get(0).isFromTagRecall()).isTrue();
        assertThat(result.get(0).isFromEsRecall()).isTrue();
        // tier=2 (仅标签) 和 tier=3 (仅ES) 排后面
        assertThat(result.subList(1, 3)).anyMatch(c -> c.getCandidateId() == 201L);
        assertThat(result.subList(1, 3)).anyMatch(c -> c.getCandidateId() == 202L);
    }

    // ─────────────────────────────────────────────
    // TC-02  去重：两路命中同一候选只出现一次
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-02 两路都命中相同候选 ID，合并后仅保留一条")
    void merge_dedup_noDuplicates() {
        mockSourceBrief("RESOURCE", 100L, "储能技术");

        when(tagRecallService.recall(anyString(), anyLong(), anyString(), any(), anyInt()))
                .thenReturn(List.of(tagCandidate(300L, 1, 1)));
        when(esRecallService.recall(anyString(), anyString(), any(), anyInt()))
                .thenReturn(List.of(
                        new EsRecallCandidate(300L, 7.0f),
                        new EsRecallCandidate(300L, 7.0f)  // 重复（模拟异常场景）
                ));

        List<MergedRecallCandidate> result = service.recall("RESOURCE", 100L, "DEMAND", null, 200);

        assertThat(result.stream().filter(c -> c.getCandidateId() == 300L)).hasSize(1);
    }

    // ─────────────────────────────────────────────
    // TC-03  maxCandidates 截断
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-03 maxCandidates=2 时，合并结果截断到 2 条")
    void merge_maxCandidates_truncates() {
        mockSourceBrief("RESOURCE", 100L, "绿色能源");

        when(tagRecallService.recall(anyString(), anyLong(), anyString(), any(), anyInt()))
                .thenReturn(List.of(
                        tagCandidate(1L, 2, 0),
                        tagCandidate(2L, 1, 0),
                        tagCandidate(3L, 1, 1)
                ));
        when(esRecallService.recall(anyString(), anyString(), any(), anyInt()))
                .thenReturn(Collections.emptyList());

        List<MergedRecallCandidate> result = service.recall("RESOURCE", 100L, "DEMAND", null, 2);

        assertThat(result).hasSize(2);
    }

    // ─────────────────────────────────────────────
    // TC-04  ES 和标签都无结果 → 返回空列表
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-04 标签与 ES 均无召回结果，返回空列表")
    void merge_noCandidates_returnsEmpty() {
        mockSourceBrief("DEMAND", 200L, "碳减排技术需求");

        when(tagRecallService.recall(anyString(), anyLong(), anyString(), any(), anyInt()))
                .thenReturn(Collections.emptyList());
        when(esRecallService.recall(anyString(), anyString(), any(), anyInt()))
                .thenReturn(Collections.emptyList());

        List<MergedRecallCandidate> result = service.recall("DEMAND", 200L, "RESOURCE", null, 200);

        assertThat(result).isEmpty();
    }

    // ─────────────────────────────────────────────
    // TC-05  ES 分数归一化：批次最高分为 1.0
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-05 ES 分数归一化：最高分候选的 esScoreNormalized = 1.0")
    void merge_esScoreNormalized() {
        mockSourceBrief("RESOURCE", 100L, "新能源");

        when(tagRecallService.recall(anyString(), anyLong(), anyString(), any(), anyInt()))
                .thenReturn(Collections.emptyList());
        when(esRecallService.recall(anyString(), anyString(), any(), anyInt()))
                .thenReturn(List.of(
                        new EsRecallCandidate(400L, 10.0f),
                        new EsRecallCandidate(401L, 5.0f)
                ));

        List<MergedRecallCandidate> result = service.recall("RESOURCE", 100L, "DEMAND", null, 200);

        MergedRecallCandidate top = result.stream()
                .filter(c -> c.getCandidateId() == 400L).findFirst().orElseThrow();
        assertThat(top.getEsScoreNormalized()).isEqualTo(1.0f);

        MergedRecallCandidate second = result.stream()
                .filter(c -> c.getCandidateId() == 401L).findFirst().orElseThrow();
        assertThat(second.getEsScoreNormalized()).isEqualTo(0.5f);
    }

    // ──────────── helpers ────────────

    private TagRecallCandidate tagCandidate(long id, int industryCount, int otherCount) {
        return TagRecallCandidate.builder()
                .candidateId(id)
                .industryTagMatchCount(industryCount)
                .otherTagMatchCount(otherCount)
                .tagScore(industryCount * 2 + otherCount)
                .matchedTagIds(Collections.emptyList())
                .matchedTagNames(Collections.emptyList())
                .build();
    }

    private void mockSourceBrief(String bizType, Long bizId, String text) {
        SupplyBriefDTO brief = new SupplyBriefDTO();
        brief.setId(bizId);
        brief.setTitle(text);
        brief.setSummary("");
        if ("RESOURCE".equals(bizType)) {
            when(supplyClient.getResourceMatchBrief(eq(bizId))).thenReturn(Result.ok(brief));
        } else {
            when(supplyClient.getDemandMatchBrief(eq(bizId))).thenReturn(Result.ok(brief));
        }
    }
}
