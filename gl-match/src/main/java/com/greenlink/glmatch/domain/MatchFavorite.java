package com.greenlink.glmatch.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("match_favorite")
public class MatchFavorite {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long accountId;
    private String bizType;
    private Long bizId;
    private LocalDateTime createdAt;
}
