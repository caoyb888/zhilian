package com.greenlink.glmatch.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("match_record")
public class MatchRecord {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long resourceId;
    private Long demandId;
    private Long resourceMemberId;
    private Long demandMemberId;
    private BigDecimal matchScore;
    private Integer matchType;
    private Integer status;
    private Long initiatorId;
    private String applyMessage;
    private Long contractId;
    private Integer evaluationDone;
    @TableLogic
    private Integer isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
