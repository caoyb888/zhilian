package com.greenlink.glsupply.enums;

import lombok.Getter;

@Getter
public enum AuditStatus {
    PENDING(0, "待审核"),
    APPROVED(1, "通过"),
    REJECTED(2, "拒绝"),
    OFFLINE(3, "已下架");

    private final int code;
    private final String desc;

    AuditStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
