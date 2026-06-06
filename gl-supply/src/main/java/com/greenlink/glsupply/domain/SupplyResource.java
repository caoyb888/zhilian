package com.greenlink.glsupply.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("supply_resource")
public class SupplyResource {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long memberId;
    private Long accountId;
    private String type;
    private String title;
    private String content;
    private String summary;
    private String province;
    private String city;
    private String cooperationMode;
    private LocalDate validUntil;
    private Integer viewCount;
    private Integer contactVisible;
    private Integer auditStatus;
    private String auditRemark;
    private Long auditorId;
    private LocalDateTime auditedAt;
    private BigDecimal carbonAmount;
    private String certType;
    private Integer isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
