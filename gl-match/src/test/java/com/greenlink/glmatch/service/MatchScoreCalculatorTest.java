package com.greenlink.glmatch.service;

import com.greenlink.common.result.Result;
import com.greenlink.glmatch.dto.MemberCompletedCount;
import com.greenlink.glmatch.dto.SupplyBriefDTO;
import com.greenlink.glmatch.engine.recall.MergedRecallCandidate;
import com.greenlink.glmatch.engine.score.MatchScoreResult;
import com.greenlink.glmatch.feign.SupplyClient;
import com.greenlink.glmatch.repository.MatchRecordMapper;
import com.greenlink.glmatch.service.impl.MatchScoreCalculatorImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

/**
 * S5-03 单元测试：综合打分计算器（T5-03-4）。
 *
 * <p>四个场景：精确匹配 / 部分匹配 / 无匹配 / 过滤已对接。
 */
@ExtendWith(MockitoExtension.class)
class MatchScoreCalculatorTest {

    @Mock
    MatchRecordMapper matchRecordMapper;

    @Mock
    SupplyClient supplyClient;

    @InjectMocks
    MatchScoreCalculatorImpl calculator;

    // ─────────────────────────────────────────────
    // TC-01  精确匹配：同行业 + 同省 → 高分（≥55）
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-01 精确匹配：行业标签命中 + 同省 → industryScore=40 + geoScore=15")
    void score_exactMatch_highScore() {
        // 候选 501：行业标签 2 个命中，其他标签 1 个，同省山东
        MergedRecallCandidate candidate = buildCandidate(501L, 1001L, "山东省",
                2, 1, List.of("新能源"), List.of("新能源", "储能"));

        stubNoMatched();
        stubNoHistory();

        List<MatchScoreResult> results = calculator.score(
                List.of(candidate),
                "RESOURCE", 100L, "山东省", 999L, 10);

        assertThat(results).hasSize(1);
        MatchScoreResult r = results.get(0);
        assertThat(r.getCandidateId()).isEqualTo(501L);
        assertThat(r.getIndustryScore()).isEqualTo(40);
        assertThat(r.getGeoScore()).isEqualTo(15);
        assertThat(r.getTagOverlapScore()).isEqualTo(10); // 1个other tag
        assertThat(r.getTotalScore()).isEqualTo(65.0);
        assertThat(r.getMatchReasons()).anyMatch(s -> s.contains("行业标签高度匹配"));
        assertThat(r.getMatchReasons()).anyMatch(s -> s.contains("地域相近"));
        assertThat(r.getMatchReasons()).anyMatch(s -> s.contains("标签重叠"));
    }

    // ─────────────────────────────────────────────
    // TC-02  部分匹配：有行业标签但省份不同 → 中等分（40）
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-02 部分匹配：行业命中但省份不同 → geoScore=0 totalScore=40")
    void score_partialMatch_mediumScore() {
        // 候选 502：行业标签命中，省份不同
        MergedRecallCandidate candidate = buildCandidate(502L, 1002L, "河南省",
                1, 0, List.of("光伏"), List.of("光伏"));

        stubNoMatched();
        stubNoHistory();

        List<MatchScoreResult> results = calculator.score(
                List.of(candidate),
                "RESOURCE", 100L, "山东省", 999L, 10);

        assertThat(results).hasSize(1);
        MatchScoreResult r = results.get(0);
        assertThat(r.getIndustryScore()).isEqualTo(40);
        assertThat(r.getGeoScore()).isEqualTo(0);
        assertThat(r.getTotalScore()).isEqualTo(40.0);
        assertThat(r.getMatchReasons()).anyMatch(s -> s.contains("行业标签高度匹配"));
        assertThat(r.getMatchReasons()).noneMatch(s -> s.contains("地域相近"));
    }

    // ─────────────────────────────────────────────
    // TC-03  无匹配：无行业标签、省份不同 → 低分（0）
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-03 无行业标签无省份命中 → totalScore=0，matchReasons 为空")
    void score_noMatch_zeroScore() {
        // 候选 503：无行业标签，otherCount=0，省份不同
        MergedRecallCandidate candidate = buildCandidate(503L, 1003L, "广东省",
                0, 0, Collections.emptyList(), Collections.emptyList());

        stubNoMatched();
        stubNoHistory();

        List<MatchScoreResult> results = calculator.score(
                List.of(candidate),
                "RESOURCE", 100L, "山东省", 999L, 10);

        assertThat(results).hasSize(1);
        MatchScoreResult r = results.get(0);
        assertThat(r.getTotalScore()).isEqualTo(0.0);
        assertThat(r.getMatchReasons()).isEmpty();
    }

    // ─────────────────────────────────────────────
    // TC-04  过滤已对接：已有活跃 match_record → 不出现在结果中
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-04 已对接候选被过滤：结果列表不含已有 match_record 的候选")
    void score_filterAlreadyMatched_excluded() {
        // 候选 504：已有对接记录；候选 505：正常候选
        MergedRecallCandidate matched = buildCandidate(504L, 1004L, "山东省",
                2, 1, List.of("碳减排"), List.of("碳减排", "CCUS"));
        MergedRecallCandidate normal = buildCandidate(505L, 1005L, "山东省",
                1, 0, List.of("储能"), List.of("储能"));

        // 模拟 504 已在 match_record（RESOURCE→DEMAND 方向，findMatchedDemandIds 返回 504）
        when(matchRecordMapper.findMatchedDemandIds(anyLong(), anyList()))
                .thenReturn(Set.of(504L));
        stubNoHistory();

        List<MatchScoreResult> results = calculator.score(
                List.of(matched, normal),
                "RESOURCE", 100L, "山东省", 999L, 10);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getCandidateId()).isEqualTo(505L);
    }

    // ─────────────────────────────────────────────
    // TC-05  历史信用加分：已完成 3 笔对接 → historyScore=6
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-05 历史信用：完成 3 次对接 → historyScore=6")
    void score_historyCreditScore() {
        MergedRecallCandidate candidate = buildCandidate(506L, 1006L, "山东省",
                1, 0, List.of("新能源"), List.of("新能源"));

        stubNoMatched();

        // 候选会员 1006 作为资源方完成 3 笔
        MemberCompletedCount row = new MemberCompletedCount();
        row.setMemberId(1006L);
        row.setCnt(3);
        when(matchRecordMapper.countCompletedByResourceMemberIds(anyList()))
                .thenReturn(List.of(row));
        when(matchRecordMapper.countCompletedByDemandMemberIds(anyList()))
                .thenReturn(Collections.emptyList());

        List<MatchScoreResult> results = calculator.score(
                List.of(candidate),
                "RESOURCE", 100L, "山东省", 999L, 10);

        assertThat(results).hasSize(1);
        MatchScoreResult r = results.get(0);
        assertThat(r.getHistoryScore()).isEqualTo(6);
        assertThat(r.getTotalScore()).isEqualTo(61.0); // 40+15+6
        assertThat(r.getMatchReasons()).anyMatch(s -> s.contains("成交信用良好"));
    }

    // ─────────────────────────────────────────────
    // TC-06  标签重叠度上限：4个 other tag → tagOverlapScore=30（上限）
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-06 标签重叠度上限：otherTagCount=4 → tagOverlapScore=30（上限30）")
    void score_tagOverlapCapped() {
        MergedRecallCandidate candidate = buildCandidate(507L, 1007L, null,
                0, 4, Collections.emptyList(), List.of("t1", "t2", "t3", "t4"));

        stubNoMatched();
        stubNoHistory();

        List<MatchScoreResult> results = calculator.score(
                List.of(candidate),
                "RESOURCE", 100L, null, 999L, 10);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTagOverlapScore()).isEqualTo(30);
        assertThat(results.get(0).getTotalScore()).isEqualTo(30.0);
    }

    // ─────────────────────────────────────────────
    // TC-07  结果排序：高分候选排在前面
    // ─────────────────────────────────────────────
    @Test
    @DisplayName("TC-07 排序：高分候选排在结果列表首位")
    void score_sorting_highScoreFirst() {
        // 候选 601：无行业无地域，score=0；候选 602：有行业有地域，score=55
        MergedRecallCandidate low = buildCandidate(601L, 1008L, "广东省",
                0, 0, Collections.emptyList(), Collections.emptyList());
        MergedRecallCandidate high = buildCandidate(602L, 1009L, "山东省",
                1, 1, List.of("新能源"), List.of("新能源", "光伏"));

        stubNoMatched();
        stubNoHistory();

        List<MatchScoreResult> results = calculator.score(
                List.of(low, high),
                "RESOURCE", 100L, "山东省", 999L, 10);

        assertThat(results).hasSize(2);
        assertThat(results.get(0).getCandidateId()).isEqualTo(602L);
        assertThat(results.get(1).getCandidateId()).isEqualTo(601L);
    }

    // ──────────── helpers ────────────

    private MergedRecallCandidate buildCandidate(Long id, Long memberId, String province,
                                                  int industryCount, int otherCount,
                                                  List<String> industryTagNames,
                                                  List<String> allTagNames) {
        return MergedRecallCandidate.builder()
                .candidateId(id)
                .candidateMemberId(memberId)
                .candidateProvince(province)
                .fromTagRecall(industryCount > 0 || otherCount > 0)
                .fromEsRecall(false)
                .industryTagMatchCount(industryCount)
                .otherTagMatchCount(otherCount)
                .tagScore(industryCount * 2 + otherCount)
                .matchedTagIds(Collections.emptyList())
                .matchedTagNames(allTagNames)
                .esScore(0f)
                .esScoreNormalized(0f)
                .build();
    }

    private void stubNoMatched() {
        when(matchRecordMapper.findMatchedDemandIds(anyLong(), anyList()))
                .thenReturn(Collections.emptySet());
    }

    private void stubNoHistory() {
        when(matchRecordMapper.countCompletedByResourceMemberIds(anyList()))
                .thenReturn(Collections.emptyList());
        when(matchRecordMapper.countCompletedByDemandMemberIds(anyList()))
                .thenReturn(Collections.emptyList());
    }
}
