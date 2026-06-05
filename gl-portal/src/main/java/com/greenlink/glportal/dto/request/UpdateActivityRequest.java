package com.greenlink.glportal.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UpdateActivityRequest {

    @Size(max = 300)
    private String title;

    private String content;

    @Size(max = 500)
    private String coverUrl;

    @Size(max = 300)
    private String location;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime regDeadline;
    private Integer maxCapacity;
}
