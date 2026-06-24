-- =====================================================================
-- V1.7.0 会员资质证书（UAT#9 注册补"上传资质证书"）
-- 在 member_unit 增加资质证书附件 URL 字段
-- =====================================================================

USE gl_member;

ALTER TABLE member_unit
    ADD COLUMN license_url VARCHAR(500) DEFAULT NULL COMMENT '资质证书/营业执照附件 URL' AFTER logo_url;
