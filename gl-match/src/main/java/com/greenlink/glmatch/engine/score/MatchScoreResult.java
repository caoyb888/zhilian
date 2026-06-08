package com.greenlink.glmatch.engine.score;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 综合打分结果（S5-03）：携带各维度分项、总分及匹配原因。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchScoreResult {

    private Long candidateId;
    private Long candidateMemberId;
    private String candidateProvince;

    // ── 分项得分 ──
    /** 行业精确匹配得分（0 或 40） */
    private int industryScore;
    /** 标签重叠度得分（0~30，每命中 1 个非行业标签 +10，上限 30） */
    private int tagOverlapScore;
    /** 地域相近得分（同省 +15，上限 20；一期无城市数据故不加城市分） */
    private int geoScore;
    /** 历史对接信用得分（每笔已完成对接 +2，上限 10） */
    private int historyScore;

    /** 综合总分（= sum(分项) × 绿色认证系数，一期认证系数恒为 1.0） */
    private double totalScore;

    // ── 解释性信息 ──
    private List<String> matchedTagNames;
    /** 供前端展示的匹配原因文字列表，如 ["行业标签高度匹配（新能源）", "地域相近（同省）"] */
    private List<String> matchReasons;
}
