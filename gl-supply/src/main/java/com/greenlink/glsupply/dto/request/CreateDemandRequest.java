package com.greenlink.glsupply.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateDemandRequest {

    @NotBlank(message = "需求类型不能为空")
    private String type;

    @NotBlank(message = "标题不能为空")
    @Size(max = 300, message = "标题不能超过300字")
    private String title;

    private String content;

    @Size(max = 500, message = "摘要不能超过500字")
    private String summary;

    private String province;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private LocalDate deadline;
    private String cooperationMode;

    @Size(max = 10, message = "标签最多选10个")
    private List<Long> tagIds;

    @Size(max = 10, message = "附件最多10个")
    private List<AttachmentDTO> attachments;
}
