package com.greenlink.glportal.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("portal_article")
public class PortalArticle {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long categoryId;
    private String title;
    private String content;
    private String summary;
    private String coverUrl;
    private String author;
    private String sourceUrl;
    private Integer viewCount;
    private Integer isTop;
    private Integer isPublished;
    private LocalDateTime publishedAt;
    private Long publisherId;
    private Integer isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
