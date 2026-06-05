package com.greenlink.glportal.dto.response;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ActivityDetailVO extends ActivityVO {

    private String content;
}
