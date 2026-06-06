package com.greenlink.glfile.enums;

import lombok.Getter;

import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 文件类型白名单（MIME + 扩展名双重验证）
 * 图片类上传至公有桶，文档类上传至私有桶。
 */
@Getter
public enum AllowedFileType {

    JPEG("image/jpeg", Set.of(".jpg", ".jpeg"), true),
    PNG("image/png", Set.of(".png"), true),
    GIF("image/gif", Set.of(".gif"), true),
    WEBP("image/webp", Set.of(".webp"), true),
    PDF("application/pdf", Set.of(".pdf"), false),
    DOC("application/msword", Set.of(".doc"), false),
    DOCX("application/vnd.openxmlformats-officedocument.wordprocessingml.document", Set.of(".docx"), false),
    XLS("application/vnd.ms-excel", Set.of(".xls"), false),
    XLSX("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", Set.of(".xlsx"), false);

    private final String mimeType;
    private final Set<String> extensions;
    private final boolean isPublic;

    AllowedFileType(String mimeType, Set<String> extensions, boolean isPublic) {
        this.mimeType = mimeType;
        this.extensions = extensions;
        this.isPublic = isPublic;
    }

    public static Optional<AllowedFileType> findByMime(String mime) {
        if (mime == null) return Optional.empty();
        String normalized = mime.toLowerCase().split(";")[0].trim();
        return Arrays.stream(values())
                .filter(t -> t.mimeType.equals(normalized))
                .findFirst();
    }

    public static Set<String> allowedMimeTypes() {
        return Arrays.stream(values()).map(AllowedFileType::getMimeType).collect(Collectors.toSet());
    }
}
