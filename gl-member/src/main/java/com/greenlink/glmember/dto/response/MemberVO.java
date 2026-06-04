package com.greenlink.glmember.dto.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/** 会员列表卡片（不含敏感联系方式） */
@Data
public class MemberVO {

    private Long id;
    private String name;
    private String shortName;
    private String industry;
    private Integer memberLevel;
    private String memberLevelName;
    private String province;
    private String city;
    private String logoUrl;
    private Boolean isCertified;
    private Integer status;
    private List<TagItem> tags;
    private LocalDateTime createdAt;

    public record TagItem(Long id, String name, String categoryCode) {}
}
