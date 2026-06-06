package com.greenlink.glfile.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FileUploadVO {

    private Long fileId;
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private String mimeType;
}
