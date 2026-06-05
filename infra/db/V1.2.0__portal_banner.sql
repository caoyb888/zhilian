-- ============================================================
-- 首页轮播图表
-- 版本：V1.2.0
-- Story：S2-08 gl-portal 首页轮播图管理
-- ============================================================

USE gl_portal;

CREATE TABLE portal_banner (
    id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    title       VARCHAR(200)     NOT NULL                COMMENT '标题（管理端内部标识，不对外展示）',
    image_url   VARCHAR(500)     NOT NULL                COMMENT '轮播图片 URL',
    link_url    VARCHAR(500)                             COMMENT '点击跳转链接（NULL 表示纯展示）',
    sort_order  INT              NOT NULL DEFAULT 0      COMMENT '排序权重，值小的排前面',
    is_active   TINYINT(1)       NOT NULL DEFAULT 1      COMMENT '是否启用：0禁用 1启用',
    start_date  DATE                                     COMMENT '生效开始日期（NULL 表示不限）',
    end_date    DATE                                     COMMENT '生效结束日期（NULL 表示不限）',
    is_deleted  TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '软删除标记',
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='首页轮播图';
