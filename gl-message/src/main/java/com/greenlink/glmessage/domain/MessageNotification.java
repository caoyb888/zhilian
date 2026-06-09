package com.greenlink.glmessage.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("message_notification")
public class MessageNotification {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long accountId;
    /** MATCH / AUDIT / ACTIVITY / SYSTEM */
    private String bizType;
    private Long bizId;
    private String title;
    private String content;
    /** SITE / WECHAT */
    private String channel;
    private Integer isRead;
    private LocalDateTime readAt;
    /** 0待发送 1已发送 2失败 */
    private Integer sendStatus;
    private LocalDateTime sendAt;
    private LocalDateTime createdAt;
}
