package com.greenlink.glsupply.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AdminResourceVO {
    private Long id;
    private Long memberId;
    private Long accountId;
    private String type;
    private String title;
    private String summary;
    private String province;
    private String city;
    private LocalDate validUntil;
    private Integer viewCount;
    private Integer auditStatus;
    private String auditRemark;
    private Long auditorId;
    private LocalDateTime auditedAt;
    private LocalDateTime createdAt;
    private List<TagSimpleVO> tags;
}
