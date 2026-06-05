package com.greenlink.glportal.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("portal_activity_signup")
public class PortalActivitySignup {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long activityId;
    private Long accountId;
    private Long memberId;
    private String remark;
    private Integer status;     // 1已报名 2已签到 3已取消
    private LocalDateTime createdAt;
}
