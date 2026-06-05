package com.greenlink.glportal.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("portal_activity")
public class PortalActivity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String title;
    private String content;
    private String coverUrl;
    private String location;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime regDeadline;
    private Integer maxCapacity;
    private Integer regCount;
    private Integer status;     // 1筹备中 2报名中 3已结束
    private Integer isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
