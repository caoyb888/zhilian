package com.greenlink.glsupply.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("supply_attachment")
public class SupplyAttachment {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String bizType;
    private Long bizId;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private String fileType;
    private Integer sortOrder;
    private LocalDateTime createdAt;
}
