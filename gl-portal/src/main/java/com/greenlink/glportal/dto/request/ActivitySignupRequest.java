package com.greenlink.glportal.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ActivitySignupRequest {

    @Size(max = 500)
    private String remark;
}
