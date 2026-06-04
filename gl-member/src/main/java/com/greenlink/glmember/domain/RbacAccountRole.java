package com.greenlink.glmember.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@TableName("rbac_account_role")
public class RbacAccountRole {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long accountId;
    private Long roleId;
    private LocalDateTime createdAt;
}
