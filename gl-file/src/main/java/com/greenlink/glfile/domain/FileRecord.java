package com.greenlink.glfile.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("file_record")
public class FileRecord {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long uploaderId;
    private String bizType;
    private Long bizId;
    private String fileName;
    private String storageKey;
    private String fileUrl;
    private Long fileSize;
    private String mimeType;
    private LocalDateTime createdAt;
}
