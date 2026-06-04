package com.greenlink.glmember.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UpdateMemberRequest {

    @Size(max = 50, message = "简称不超过50字")
    private String shortName;

    private String industry;
    private String province;
    private String city;

    @Size(max = 2000, message = "简介不超过2000字")
    private String introduction;

    private String contactName;

    @Pattern(regexp = "^(1[3-9]\\d{9})?$", message = "手机号格式不正确")
    private String contactPhone;

    @Email(message = "邮箱格式不正确")
    private String contactEmail;

    private Long logoFileId;
    private List<Long> tagIds;
}
