package com.greenlink.glmatch.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("match_message")
public class MatchMessage {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long matchId;
    private Long senderId;
    private String content;
    private Integer msgType;
    private String attachUrl;
    private Integer isRead;
    private LocalDateTime createdAt;
}
