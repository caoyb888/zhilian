package com.greenlink.glfile.service;

import com.greenlink.glfile.dto.response.FileUploadVO;
import com.greenlink.glfile.dto.response.PresignUrlVO;
import org.springframework.web.multipart.MultipartFile;

public interface FileService {

    /**
     * 上传文件：类型/大小校验 → UUID 重命名 → MinIO 存储 → 写入 file_record
     *
     * @param file       multipart 文件
     * @param bizType    业务类型（RESOURCE/DEMAND/MEMBER/ARTICLE 等，可空）
     * @param bizId      关联业务ID（可空）
     * @param uploaderId 上传账号ID（由 Gateway 传入 Header）
     * @return 上传结果（fileId, fileUrl）
     */
    FileUploadVO upload(MultipartFile file, String bizType, Long bizId, Long uploaderId);

    /**
     * 生成预签名访问 URL（私有桶 1 小时有效；公有桶直接返回原 URL）
     *
     * @param fileId file_record 主键
     * @return 预签名 URL 及有效期信息
     */
    PresignUrlVO presignUrl(Long fileId);
}
