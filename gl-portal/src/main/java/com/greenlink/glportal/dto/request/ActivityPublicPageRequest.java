package com.greenlink.glportal.dto.request;

import lombok.Data;

@Data
public class ActivityPublicPageRequest {

    /** 可选：2=报名中，3=已结束；不传则返回全部公开活动 */
    private Integer status;
    private int page = 1;
    private int size = 20;
}
