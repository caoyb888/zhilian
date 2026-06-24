package com.greenlink.glmember.dto.response;

import lombok.Data;
import lombok.EqualsAndHashCode;

/** 会员单位详情（联系方式按登录状态脱敏） */
@Data
@EqualsAndHashCode(callSuper = true)
public class MemberDetailVO extends MemberVO {

    private String introduction;
    /** 资质证书/营业执照附件 URL */
    private String licenseUrl;
    /** 联系人（未登录脱敏为 "***"） */
    private String contactName;
    /** 联系电话（未登录脱敏为 "138****8888"） */
    private String contactPhone;
    /** 邮箱（未登录脱敏为 "zha***@domain.com"） */
    private String contactEmail;
    private String joinDate;
}
