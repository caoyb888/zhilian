package com.greenlink.glmember.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("member_unit")
public class MemberUnit {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String shortName;
    private String industry;
    private String province;
    private String city;
    /** 1普通 2VIP 3理事 */
    private Integer memberLevel;
    private BigDecimal creditScore;
    private String logoUrl;
    private String introduction;
    private String contactName;
    private String contactPhone;
    private String contactEmail;
    /** 是否绿色认证（预留二期） */
    private Integer isCertified;
    /** 0禁用 1正常 2审核中 */
    private Integer status;
    private LocalDate joinDate;
    @TableLogic
    private Integer isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
