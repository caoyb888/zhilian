package com.greenlink.glportal.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("portal_category")
public class PortalCategory {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long parentId;
    private String name;
    private String code;
    private Integer sortOrder;
    private Integer isVisible;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
