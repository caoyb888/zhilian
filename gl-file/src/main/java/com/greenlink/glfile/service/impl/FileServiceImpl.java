package com.greenlink.glfile.service.impl;

import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glfile.config.MinioProperties;
import com.greenlink.glfile.domain.FileRecord;
import com.greenlink.glfile.dto.response.FileUploadVO;
import com.greenlink.glfile.dto.response.PresignUrlVO;
import com.greenlink.glfile.enums.AllowedFileType;
import com.greenlink.glfile.repository.FileRecordMapper;
import com.greenlink.glfile.service.FileService;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileServiceImpl implements FileService {

    private static final long MAX_FILE_SIZE = 20L * 1024 * 1024;
    private static final DateTimeFormatter DATE_PATH = DateTimeFormatter.ofPattern("yyyy/MM/dd");
    private static final int PRESIGN_EXPIRY_SECONDS = 3600;

    private final MinioClient minioClient;
    private final MinioProperties props;
    private final FileRecordMapper fileRecordMapper;

    @Override
    @Transactional
    public FileUploadVO upload(MultipartFile file, String bizType, Long bizId, Long uploaderId) {
        validateSize(file);
        AllowedFileType fileType = validateType(file);

        String originalName = StringUtils.hasText(file.getOriginalFilename())
                ? file.getOriginalFilename() : "unknown";
        String ext = extractExtension(originalName);
        String storageKey = buildStorageKey(bizType, ext);
        String bucket = fileType.isPublic() ? props.getPublicBucketName() : props.getBucketName();

        uploadToMinio(file, bucket, storageKey);

        String fileUrl = buildUrl(bucket, storageKey);
        FileRecord record = saveRecord(uploaderId, bizType, bizId, originalName,
                storageKey, fileUrl, file.getSize(), file.getContentType());

        log.info("文件上传成功: fileId={}, key={}, size={}", record.getId(), storageKey, file.getSize());
        return FileUploadVO.builder()
                .fileId(record.getId())
                .fileUrl(fileUrl)
                .fileName(originalName)
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .build();
    }

    private void validateSize(MultipartFile file) {
        if (file.isEmpty() || file.getSize() > MAX_FILE_SIZE) {
            throw new BizException(ResultCode.FILE_SIZE_EXCEEDED);
        }
    }

    private AllowedFileType validateType(MultipartFile file) {
        String mime = file.getContentType();
        AllowedFileType fileType = AllowedFileType.findByMime(mime)
                .orElseThrow(() -> new BizException(ResultCode.FILE_TYPE_NOT_ALLOWED));

        String ext = extractExtension(file.getOriginalFilename());
        if (!fileType.getExtensions().contains(ext.toLowerCase())) {
            throw new BizException(ResultCode.FILE_TYPE_NOT_ALLOWED);
        }
        return fileType;
    }

    private String extractExtension(String filename) {
        if (!StringUtils.hasText(filename) || !filename.contains(".")) {
            return "";
        }
        return "." + filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    private String buildStorageKey(String bizType, String ext) {
        String prefix = StringUtils.hasText(bizType) ? bizType.toLowerCase() : "general";
        String datePath = LocalDate.now().format(DATE_PATH);
        return prefix + "/" + datePath + "/" + UUID.randomUUID() + ext;
    }

    private void uploadToMinio(MultipartFile file, String bucket, String storageKey) {
        try (InputStream is = file.getInputStream()) {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(storageKey)
                    .stream(is, file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
        } catch (Exception e) {
            log.error("MinIO 上传失败: bucket={}, key={}", bucket, storageKey, e);
            throw new BizException(ResultCode.FILE_UPLOAD_FAIL);
        }
    }

    private String buildUrl(String bucket, String storageKey) {
        String cdnUrl = props.getCdnUrl();
        if (StringUtils.hasText(cdnUrl)) {
            return cdnUrl.replaceAll("/$", "") + "/" + bucket + "/" + storageKey;
        }
        return props.getEndpoint().replaceAll("/$", "") + "/" + bucket + "/" + storageKey;
    }

    @Override
    public PresignUrlVO presignUrl(Long fileId) {
        FileRecord record = fileRecordMapper.selectById(fileId);
        if (record == null) {
            throw new BizException(ResultCode.FILE_NOT_FOUND);
        }

        boolean isPublicFile = AllowedFileType.findByMime(record.getMimeType())
                .map(AllowedFileType::isPublic)
                .orElse(false);

        if (isPublicFile) {
            return PresignUrlVO.builder()
                    .fileId(fileId)
                    .presignUrl(record.getFileUrl())
                    .expireSeconds(null)
                    .isPublic(true)
                    .build();
        }

        String bucket = props.getBucketName();
        String url = generatePresignedUrl(bucket, record.getStorageKey());
        log.info("预签名 URL 生成: fileId={}, bucket={}, expiry={}s", fileId, bucket, PRESIGN_EXPIRY_SECONDS);
        return PresignUrlVO.builder()
                .fileId(fileId)
                .presignUrl(url)
                .expireSeconds(PRESIGN_EXPIRY_SECONDS)
                .isPublic(false)
                .build();
    }

    private String generatePresignedUrl(String bucket, String storageKey) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucket)
                            .object(storageKey)
                            .expiry(PRESIGN_EXPIRY_SECONDS, TimeUnit.SECONDS)
                            .build());
        } catch (Exception e) {
            log.error("预签名 URL 生成失败: bucket={}, key={}", bucket, storageKey, e);
            throw new BizException(ResultCode.FILE_UPLOAD_FAIL);
        }
    }

    @Transactional
    protected FileRecord saveRecord(Long uploaderId, String bizType, Long bizId,
                                    String fileName, String storageKey,
                                    String fileUrl, long fileSize, String mimeType) {
        FileRecord record = new FileRecord();
        record.setUploaderId(uploaderId);
        record.setBizType(bizType);
        record.setBizId(bizId);
        record.setFileName(fileName);
        record.setStorageKey(storageKey);
        record.setFileUrl(fileUrl);
        record.setFileSize(fileSize);
        record.setMimeType(mimeType);
        fileRecordMapper.insert(record);
        return record;
    }
}
