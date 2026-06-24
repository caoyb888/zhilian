package com.greenlink.glfile.service;

import com.greenlink.common.exception.BizException;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glfile.config.MinioProperties;
import com.greenlink.glfile.domain.FileRecord;
import com.greenlink.glfile.dto.response.FileUploadVO;
import com.greenlink.glfile.dto.response.PresignUrlVO;
import com.greenlink.glfile.repository.FileRecordMapper;
import com.greenlink.glfile.service.impl.FileServiceImpl;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FileServiceTest {

    @Mock MinioClient minioClient;
    @Mock MinioProperties minioProps;
    @Mock FileRecordMapper fileRecordMapper;

    @InjectMocks FileServiceImpl service;

    @BeforeEach
    void setUp() {
        when(minioProps.getEndpoint()).thenReturn("http://localhost:9000");
        when(minioProps.getBucketName()).thenReturn("greenlink");
        when(minioProps.getPublicBucketName()).thenReturn("greenlink-public");
        when(minioProps.getCdnUrl()).thenReturn("");
        when(fileRecordMapper.insert(any(FileRecord.class))).thenAnswer(inv -> {
            FileRecord r = inv.getArgument(0);
            r.setId(1L);
            return 1;
        });
    }

    // 场景1：正常上传图片 → 返回 fileId 和 fileUrl
    @Test
    void upload_image_success() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "logo.png", "image/png", new byte[1024]);

        FileUploadVO vo = service.upload(file, "MEMBER", 10L, 99L);

        assertThat(vo.getFileId()).isEqualTo(1L);
        assertThat(vo.getFileUrl()).contains("greenlink-public");
        assertThat(vo.getMimeType()).isEqualTo("image/png");
        assertThat(vo.getFileName()).isEqualTo("logo.png");
        // storage_key 不含原始文件名
        ArgumentCaptor<FileRecord> captor = ArgumentCaptor.forClass(FileRecord.class);
        verify(fileRecordMapper).insert(captor.capture());
        assertThat(captor.getValue().getStorageKey()).doesNotContain("logo");
        verify(minioClient).putObject(any(PutObjectArgs.class));
    }

    // 场景2：文件类型不在白名单 → code 6000
    @Test
    void upload_type_not_allowed_throws_6000() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "shell.sh", "application/x-sh", new byte[100]);

        assertThatThrownBy(() -> service.upload(file, null, null, 1L))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode())
                        .isEqualTo(ResultCode.FILE_TYPE_NOT_ALLOWED.getCode()));

        verifyNoInteractions(minioClient);
        verifyNoInteractions(fileRecordMapper);
    }

    // 场景3：文件超过 100MB → code 6001
    @Test
    void upload_file_too_large_throws_6001() {
        byte[] bigData = new byte[101 * 1024 * 1024];
        MockMultipartFile file = new MockMultipartFile(
                "file", "large.pdf", "application/pdf", bigData);

        assertThatThrownBy(() -> service.upload(file, null, null, 1L))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode())
                        .isEqualTo(ResultCode.FILE_SIZE_EXCEEDED.getCode()));

        verifyNoInteractions(minioClient);
        verifyNoInteractions(fileRecordMapper);
    }

    // 场景4：MinIO 故障 → code 6002（不抛出 500）
    @Test
    void upload_minio_error_throws_6002() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "report.pdf", "application/pdf", new byte[512]);
        doThrow(new RuntimeException("connection refused"))
                .when(minioClient).putObject(any(PutObjectArgs.class));

        assertThatThrownBy(() -> service.upload(file, "RESOURCE", 5L, 2L))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode())
                        .isEqualTo(ResultCode.FILE_UPLOAD_FAIL.getCode()));

        verifyNoInteractions(fileRecordMapper);
    }

    // 场景5：私有桶文件 → 返回预签名 URL，有效期 3600s
    @Test
    void presignUrl_private_file_returns_signed_url() throws Exception {
        FileRecord record = new FileRecord();
        record.setId(10L);
        record.setMimeType("application/pdf");
        record.setStorageKey("resource/2026/06/06/uuid.pdf");
        record.setFileUrl("http://localhost:9000/greenlink/resource/2026/06/06/uuid.pdf");
        when(fileRecordMapper.selectById(10L)).thenReturn(record);
        when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                .thenReturn("http://localhost:9000/greenlink/resource/2026/06/06/uuid.pdf?X-Amz-Signature=abc");

        PresignUrlVO vo = service.presignUrl(10L);

        assertThat(vo.getFileId()).isEqualTo(10L);
        assertThat(vo.getPresignUrl()).contains("X-Amz-Signature");
        assertThat(vo.getExpireSeconds()).isEqualTo(3600);
        assertThat(vo.isPublic()).isFalse();
    }

    // 场景6：公有桶文件（图片）→ 直接返回原 URL，无有效期
    @Test
    void presignUrl_public_file_returns_original_url() {
        FileRecord record = new FileRecord();
        record.setId(20L);
        record.setMimeType("image/png");
        record.setStorageKey("member/2026/06/06/uuid.png");
        record.setFileUrl("http://localhost:9000/greenlink-public/member/2026/06/06/uuid.png");
        when(fileRecordMapper.selectById(20L)).thenReturn(record);

        PresignUrlVO vo = service.presignUrl(20L);

        assertThat(vo.isPublic()).isTrue();
        assertThat(vo.getPresignUrl()).isEqualTo(record.getFileUrl());
        assertThat(vo.getExpireSeconds()).isNull();
        verifyNoInteractions(minioClient);
    }

    // 场景7：fileId 不存在 → code 6003
    @Test
    void presignUrl_file_not_found_throws_6003() {
        when(fileRecordMapper.selectById(999L)).thenReturn(null);

        assertThatThrownBy(() -> service.presignUrl(999L))
                .isInstanceOf(BizException.class)
                .satisfies(e -> assertThat(((BizException) e).getCode())
                        .isEqualTo(ResultCode.FILE_NOT_FOUND.getCode()));

        verifyNoInteractions(minioClient);
    }
}
