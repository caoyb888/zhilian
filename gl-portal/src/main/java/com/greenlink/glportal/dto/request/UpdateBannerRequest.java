package com.greenlink.glportal.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateBannerRequest {

    @Size(max = 200)
    private String title;

    @Size(max = 500)
    private String imageUrl;

    @Size(max = 500)
    private String linkUrl;

    private Integer sortOrder;

    private Integer isActive;

    private LocalDate startDate;

    private LocalDate endDate;
}
