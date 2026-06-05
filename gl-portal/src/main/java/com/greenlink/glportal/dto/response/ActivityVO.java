package com.greenlink.glportal.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ActivityVO {

    private Long id;
    private String title;
    private String coverUrl;
    private String location;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime regDeadline;
    private Integer maxCapacity;
    private Integer regCount;
    private Integer status;
    private LocalDateTime createdAt;
}
