package com.greenlink.glmember.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class RegisterRequest {

    @NotBlank(message = "单位名称不能为空")
    @Size(max = 200, message = "单位名称不超过200字")
    private String name;

    @Size(max = 50, message = "简称不超过50字")
    private String shortName;

    @NotBlank(message = "所属行业不能为空")
    private String industry;

    private String province;
    private String city;
    private String introduction;
    private String contactName;

    @NotBlank(message = "联系电话不能为空")
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;

    @Email(message = "邮箱格式不正确")
    private String email;

    @NotBlank(message = "用户名不能为空")
    @Size(min = 4, max = 50, message = "用户名长度为4-50位")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "用户名只能包含字母、数字和下划线")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 20, message = "密码长度须为8-20位")
    @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d).+$", message = "密码须同时包含字母和数字")
    private String password;

    @NotBlank(message = "短信验证码不能为空")
    private String smsCode;

    private List<Long> tagIds;
}
