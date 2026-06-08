package com.greenlink.glmatch.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendMessageRequest {

    /** 1文本 2附件 */
    @NotNull(message = "消息类型不能为空")
    private Integer msgType;

    @NotBlank(message = "消息内容不能为空")
    @Size(max = 2000, message = "消息内容不能超过2000字")
    private String content;

    @Size(max = 500, message = "附件URL不能超过500字符")
    private String attachUrl;
}
