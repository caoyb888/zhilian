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

    // 通用错误
    PARAM_ERROR(1001, "参数错误"),
    UNAUTHORIZED(1002, "未登录或登录已过期"),
    FORBIDDEN(1003, "无操作权限"),
    NOT_FOUND(1004, "资源不存在"),
    SYSTEM_ERROR(1000, "系统繁忙，请稍后重试"),

    // 会员/认证模块 2000-2999
    USER_NOT_FOUND(2001, "用户不存在"),
    PASSWORD_ERROR(2002, "密码错误"),
    ACCOUNT_LOCKED(2003, "账号已锁定，请30分钟后再试"),
    ACCOUNT_DISABLED(2004, "账号已禁用"),
    TOKEN_EXPIRED(2005, "Token 已过期"),
    TOKEN_INVALID(2006, "Token 非法"),
    MEMBER_NOT_FOUND(2010, "会员单位不存在"),
    MEMBER_NOT_CERTIFIED(2011, "会员单位未认证"),

    // 供需/匹配模块 3000-3999
    RESOURCE_NOT_FOUND(3001, "资源不存在"),
    DEMAND_NOT_FOUND(3002, "需求不存在"),
    RESOURCE_AUDIT_PENDING(3003, "资源审核中"),
    MATCH_NOT_FOUND(3010, "对接记录不存在"),

    // 门户模块 4000-4999
    ARTICLE_NOT_FOUND(4001, "文章不存在"),
    ACTIVITY_NOT_FOUND(4002, "活动不存在"),
    ACTIVITY_FULL(4003, "活动报名已满"),
    ACTIVITY_CLOSED(4004, "活动报名已截止"),

    // 消息/通知模块 5000-5999
    MESSAGE_SEND_FAIL(5001, "消息发送失败"),
    WECHAT_PUSH_FAIL(5002, "微信推送失败");

    private final int code;
    private final String msg;

    ResultCode(int code, String msg) {
        this.code = code;
        this.msg = msg;
    }
}
