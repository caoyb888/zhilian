package com.greenlink.glmember.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("member_account")
public class MemberAccount {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long memberId;
    private Long parentId;
    private String username;
    private String passwordHash;
    private String phone;
    private String email;
    private String realName;
    private String avatarUrl;
    private String openid;
    private Integer failCount;
    private LocalDateTime lockedUntil;
    private LocalDateTime lastLoginAt;
    private String lastLoginIp;
    /** 0禁用 1正常 */
    private Integer status;
    @TableLogic
    private Integer isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
