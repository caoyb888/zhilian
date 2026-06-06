package com.greenlink.glsupply.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateResourceRequest {

    private String type;

    @Size(max = 300, message = "标题不能超过300字")
    private String title;

    private String content;

    @Size(max = 500, message = "摘要不能超过500字")
    private String summary;

    private String province;
    private String city;
    private String cooperationMode;
    private LocalDate validUntil;
    private Boolean contactVisible;

    @Size(max = 10, message = "标签最多选10个")
    private List<Long> tagIds;

    @Size(max = 10, message = "附件最多10个")
    private List<AttachmentDTO> attachments;
}
