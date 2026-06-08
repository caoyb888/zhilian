package com.greenlink.glmatch.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/** 推荐列表单条记录（api-spec §6.2） */
@Data
@Builder
public class RecommendItemVO {

    private String targetType;
    private Long targetId;
    private String targetTitle;
    private TargetMemberVO targetMember;

    /** 综合匹配度评分（0-100） */
    private double matchScore;
    private List<String> matchReasons;
    /** 是否已发起过对接申请（含被拒/已撤销） */
    private boolean isApplied;

    @Data
    @Builder
    public static class TargetMemberVO {
        private Long id;
        private String name;
        private Integer memberLevel;
        private String province;
    }
}
