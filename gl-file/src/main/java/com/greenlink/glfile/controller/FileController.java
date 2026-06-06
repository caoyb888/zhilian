package com.greenlink.glfile.controller;

import com.greenlink.common.result.Result;
import com.greenlink.glfile.dto.response.FileUploadVO;
import com.greenlink.glfile.dto.response.PresignUrlVO;
import com.greenlink.glfile.service.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    /**
     * POST /api/v1/files/upload
     * Gateway 将已验证的登录账号ID通过 X-Account-Id 请求头传入。
     */
    @PostMapping("/upload")
    public Result<FileUploadVO> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "bizType", required = false) String bizType,
            @RequestParam(value = "bizId", required = false) Long bizId,
            @RequestHeader(value = "X-Account-Id", defaultValue = "0") Long uploaderId) {

        log.info("文件上传请求: originalName={}, size={}, bizType={}, uploaderId={}",
                file.getOriginalFilename(), file.getSize(), bizType, uploaderId);
        FileUploadVO vo = fileService.upload(file, bizType, bizId, uploaderId);
        return Result.ok(vo);
    }

    /**
     * GET /api/v1/files/{fileId}/presign-url
     * 私有桶文件返回 1 小时有效的预签名 URL；公有桶文件直接返回原 URL。
     */
    @GetMapping("/{fileId}/presign-url")
    public Result<PresignUrlVO> presignUrl(@PathVariable Long fileId) {
        return Result.ok(fileService.presignUrl(fileId));
    }
}
