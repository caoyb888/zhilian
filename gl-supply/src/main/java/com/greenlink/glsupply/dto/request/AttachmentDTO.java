package com.greenlink.glsupply.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AttachmentDTO {

    @NotBlank(message = "文件名不能为空")
    private String fileName;

    @NotBlank(message = "文件URL不能为空")
    private String fileUrl;

    private Long fileSize;
    private String fileType;
    private Integer sortOrder;
}
