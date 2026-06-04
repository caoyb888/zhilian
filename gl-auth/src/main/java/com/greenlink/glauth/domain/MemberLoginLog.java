package com.greenlink.glauth.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@TableName("member_login_log")
public class MemberLoginLog {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long accountId;
    private LocalDateTime loginTime;
    private String ip;
    /** PC/H5/WECHAT/MINIAPP */
    private String terminal;
    /** 1成功 0失败 */
    private Integer result;
    private String failReason;
    private LocalDateTime createdAt;
}
