package com.greenlink.common.result;

import lombok.Getter;

/**
 * 业务错误码规范（见 CLAUDE.md §6.2）
 * 0=成功, 1000-1999=通用, 2000-2999=会员/认证, 3000-3999=供需/匹配,
 * 4000-4999=门户, 5000-5999=消息/通知
 */
@Getter
public enum ResultCode {

    SUCCESS(0, "success"),

    // 通用错误 1000-1999
    SYSTEM_ERROR(1000, "系统繁忙，请稍后重试"),
    PARAM_ERROR(1001, "参数错误"),
    UNAUTHORIZED(1002, "未登录或登录已过期"),
    FORBIDDEN(1003, "无操作权限"),
    NOT_FOUND(1004, "资源不存在"),
    TOO_MANY_REQUESTS(1030, "请求过于频繁，请稍后再试"),

    // 会员/认证模块 2000-2999
    LOGIN_FAIL(2000, "用户名或密码错误"),
    ACCOUNT_LOCKED(2001, "账号已锁定，请稍后再试"),
    ACCOUNT_DISABLED(2002, "账号已禁用，请联系管理员"),
    CAPTCHA_INVALID(2003, "验证码错误或已过期"),
    SMS_CODE_INVALID(2004, "短信验证码错误或已过期"),
    TOKEN_EXPIRED(2005, "Token 已过期"),
    TOKEN_INVALID(2006, "Token 非法"),
    USER_NOT_FOUND(2007, "用户不存在"),
    MEMBER_NOT_FOUND(2010, "会员单位不存在"),
    USERNAME_EXISTS(2011, "用户名已被占用"),
    PHONE_EXISTS(2012, "手机号已被注册"),
    PERMISSION_DENIED(2013, "无权操作该资源"),

    // 供需/匹配模块 3000-3999
    RESOURCE_NOT_FOUND(3001, "资源不存在"),
    DEMAND_NOT_FOUND(3002, "需求不存在"),
    RESOURCE_AUDIT_PENDING(3003, "资源审核中"),
    RESOURCE_AUDIT_INVALID_STATUS(3004, "当前资源状态不允许此审核操作"),
    MATCH_NOT_FOUND(3010, "对接记录不存在"),

    // 门户模块 4000-4999
    CATEGORY_NOT_FOUND(4000, "栏目不存在"),
    ARTICLE_NOT_FOUND(4001, "文章不存在"),
    ACTIVITY_NOT_FOUND(4002, "活动不存在"),
    ACTIVITY_FULL(4003, "活动报名已满"),
    ACTIVITY_CLOSED(4004, "活动报名已截止"),
    ACTIVITY_STATUS_NOT_OPEN(4005, "活动当前不接受报名"),
    SIGNUP_DUPLICATE(4006, "已报名该活动，请勿重复提交"),
    BANNER_NOT_FOUND(4007, "轮播图不存在"),

    // 消息/通知模块 5000-5999
    MESSAGE_SEND_FAIL(5001, "消息发送失败"),
    WECHAT_PUSH_FAIL(5002, "微信推送失败"),

    // 文件模块 6000-6999
    FILE_TYPE_NOT_ALLOWED(6000, "不支持的文件类型"),
    FILE_SIZE_EXCEEDED(6001, "文件大小超过限制（最大 20MB）"),
    FILE_UPLOAD_FAIL(6002, "文件上传失败，请稍后重试"),
    FILE_NOT_FOUND(6003, "文件不存在");

    private final int code;
    private final String msg;

    ResultCode(int code, String msg) {
        this.code = code;
        this.msg = msg;
    }
}
