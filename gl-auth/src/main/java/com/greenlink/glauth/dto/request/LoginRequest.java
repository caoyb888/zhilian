package com.greenlink.glauth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "用户名不能为空")
    private String username;

    @NotBlank(message = "密码不能为空")
    private String password;

    /** 连续失败 ≥5 次后必填 */
    private String captchaToken;
    private String captchaCode;

    /** 登录终端：PC/H5/WECHAT/MINIAPP，默认 PC */
    private String terminal = "PC";
}
