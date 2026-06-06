package com.greenlink.glfile.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenlink.common.exception.BizException;
import com.greenlink.common.exception.GlobalExceptionHandler;
import com.greenlink.common.result.ResultCode;
import com.greenlink.glfile.dto.response.FileUploadVO;
import com.greenlink.glfile.dto.response.PresignUrlVO;
import com.greenlink.glfile.service.FileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * S3-13 接口自动化测试：文件上传模块（TC-S3-13-01 ~ TC-S3-13-05）
 */
@ExtendWith(MockitoExtension.class)
class FileControllerTest {

    private MockMvc mockMvc;

    @Mock FileService fileService;
    @InjectMocks FileController fileController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(fileController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-S3-13-01  POST /api/v1/files/upload — 正常上传 PNG 图片
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-S3-13-01 upload — 正常上传PNG图片，返回 code=0 及 fileId/fileUrl/mimeType")
    void tc01_upload_image_success() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "logo.png", "image/png", new byte[2048]);

        FileUploadVO vo = FileUploadVO.builder()
                .fileId(1L)
                .fileUrl("http://minio:9020/greenlink-public/member/2026/06/06/uuid.png")
                .fileName("logo.png")
                .fileSize(2048L)
                .mimeType("image/png")
                .build();
        when(fileService.upload(any(), isNull(), isNull(), eq(100L))).thenReturn(vo);

        mockMvc.perform(multipart("/api/v1/files/upload")
                        .file(file)
                        .header("X-Account-Id", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.fileId").value(1))
                .andExpect(jsonPath("$.data.mimeType").value("image/png"))
                .andExpect(jsonPath("$.data.fileUrl").value(
                        "http://minio:9020/greenlink-public/member/2026/06/06/uuid.png"));
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-S3-13-02  POST /api/v1/files/upload — 文件类型不在白名单，返回 code=6000
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-S3-13-02 upload — 不支持的文件类型(application/x-sh)，返回 code=6000")
    void tc02_upload_type_not_allowed_returns6000() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "exploit.sh", "application/x-sh", new byte[100]);

        when(fileService.upload(any(), any(), any(), any()))
                .thenThrow(new BizException(ResultCode.FILE_TYPE_NOT_ALLOWED));

        mockMvc.perform(multipart("/api/v1/files/upload")
                        .file(file)
                        .header("X-Account-Id", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(6000))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-S3-13-03  POST /api/v1/files/upload — 超过 20MB，返回 code=6001
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-S3-13-03 upload — 文件超过20MB，返回 code=6001")
    void tc03_upload_file_too_large_returns6001() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "large.pdf", "application/pdf", new byte[1024]);

        when(fileService.upload(any(), any(), any(), any()))
                .thenThrow(new BizException(ResultCode.FILE_SIZE_EXCEEDED));

        mockMvc.perform(multipart("/api/v1/files/upload")
                        .file(file)
                        .header("X-Account-Id", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(6001))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-S3-13-04  POST /api/v1/files/upload — MinIO 故障，返回 code=6002（非 500）
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-S3-13-04 upload — MinIO连接故障，返回 code=6002 而非 500")
    void tc04_upload_minio_failure_returns6002() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "report.pdf", "application/pdf", new byte[512]);

        when(fileService.upload(any(), any(), any(), any()))
                .thenThrow(new BizException(ResultCode.FILE_UPLOAD_FAIL));

        mockMvc.perform(multipart("/api/v1/files/upload")
                        .file(file)
                        .header("X-Account-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(6002));
    }

    // ────────────────────────────────────────────────────────────────────────────
    // TC-S3-13-05  GET /api/v1/files/{id}/presign-url — 私有桶文件，返回预签名URL
    // ────────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("TC-S3-13-05 presignUrl — 私有桶文件，返回含签名URL及 expireSeconds=3600")
    void tc05_presignUrl_private_file_returns_signed_url() throws Exception {
        PresignUrlVO vo = PresignUrlVO.builder()
                .fileId(10L)
                .presignUrl("http://minio:9020/greenlink/resource/uuid.pdf?X-Amz-Signature=abc123")
                .expireSeconds(3600)
                .isPublic(false)
                .build();
        when(fileService.presignUrl(10L)).thenReturn(vo);

        mockMvc.perform(get("/api/v1/files/10/presign-url"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.fileId").value(10))
                .andExpect(jsonPath("$.data.presignUrl").value(
                        "http://minio:9020/greenlink/resource/uuid.pdf?X-Amz-Signature=abc123"))
                .andExpect(jsonPath("$.data.expireSeconds").value(3600))
                .andExpect(jsonPath("$.data.public").value(false));
    }
}
