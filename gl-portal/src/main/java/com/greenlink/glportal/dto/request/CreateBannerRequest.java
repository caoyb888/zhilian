package com.greenlink.glportal.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateBannerRequest {

    @NotBlank(message = "轮播图标题不能为空")
    @Size(max = 200)
    private String title;

    @NotBlank(message = "图片URL不能为空")
    @Size(max = 500)
    private String imageUrl;

    @Size(max = 500)
    private String linkUrl;

    private Integer sortOrder = 0;

    private Integer isActive = 1;

    private LocalDate startDate;

    private LocalDate endDate;
}
