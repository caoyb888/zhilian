package com.greenlink.glportal.dto.request;

import lombok.Data;

@Data
public class BannerPageRequest {

    private Integer page = 1;
    private Integer size = 20;
    private Integer isActive;   // 管理端可按启用状态筛选
}
