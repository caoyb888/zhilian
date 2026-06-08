package com.greenlink.glmatch.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MatchMessageVO {

    private Long id;
    private Long matchId;
    private Long senderId;
    /** 1文本 2附件 */
    private Integer msgType;
    private String content;
    private String attachUrl;
    /** 0未读 1已读 */
    private Integer isRead;
    private LocalDateTime createdAt;
}
