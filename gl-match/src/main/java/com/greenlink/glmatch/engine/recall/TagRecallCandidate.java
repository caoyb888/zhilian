package com.greenlink.glmatch.engine.recall;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 标签召回阶段的候选项，携带匹配度原始分数，供后续打分阶段叠加。
 */
@Data
@Builder
public class TagRecallCandidate {

    /** 候选实体 ID（资源或需求） */
    private Long candidateId;

    /** 候选实体所属会员 ID（省去后续重查） */
    private Long candidateMemberId;

    /** 候选实体省份 */
    private String candidateProvince;

    /** 行业标签命中数（INDUSTRY 类别，权重较高） */
    private int industryTagMatchCount;

    /** 其他标签命中数（技术域/资源类型等，权重较低） */
    private int otherTagMatchCount;

    /**
     * 标签综合得分 = industryTagMatchCount × 2 + otherTagMatchCount。
     * 作为后续综合打分的标签维度输入（占 30 分上限）。
     */
    private int tagScore;

    /** 命中的标签 ID 列表（用于生成 matchReasons） */
    private List<Long> matchedTagIds;

    /** 命中的标签名称列表（用于前端展示 matchReasons） */
    private List<String> matchedTagNames;
}
