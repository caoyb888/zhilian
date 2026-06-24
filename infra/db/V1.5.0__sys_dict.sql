-- =====================================================================
-- V1.5.0 数据字典（sys_dict_type / sys_dict_item）
-- 支撑 UAT 改进项 #2（资源类型 5 类）/ #11（需求类型下拉，可灵活增加）
-- Schema: gl_common（由 gl-tag 服务维护）
-- =====================================================================

CREATE DATABASE IF NOT EXISTS gl_common
    DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gl_common;

-- 字典类型
CREATE TABLE IF NOT EXISTS sys_dict_type (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL COMMENT '类型编码 RESOURCE_TYPE/DEMAND_TYPE/CITY 等',
    name        VARCHAR(100) NOT NULL COMMENT '类型名称',
    remark      VARCHAR(300) COMMENT '备注',
    is_active   TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '是否启用',
    is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字典类型';

-- 字典项
CREATE TABLE IF NOT EXISTS sys_dict_item (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type_code    VARCHAR(50)  NOT NULL COMMENT '关联 sys_dict_type.code',
    item_value   VARCHAR(50)  NOT NULL COMMENT '字典值，如 TECH_SERVICE',
    item_label   VARCHAR(100) NOT NULL COMMENT '展示名，如 技术服务',
    parent_value VARCHAR(50)  DEFAULT NULL COMMENT '父级值（省-市级联预留）',
    sort_order   INT          NOT NULL DEFAULT 0,
    is_active    TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '是否启用',
    is_deleted   TINYINT(1)   NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type_code),
    INDEX idx_parent (type_code, parent_value),
    UNIQUE KEY uk_type_value (type_code, item_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字典项';

-- ---------------------------------------------------------------------
-- 初始化数据
-- ---------------------------------------------------------------------
INSERT INTO sys_dict_type (code, name, remark) VALUES
    ('RESOURCE_TYPE', '资源类型', 'UAT#2 资源发布类型'),
    ('DEMAND_TYPE',   '需求类型', 'UAT#11 需求发布类型')
ON DUPLICATE KEY UPDATE name = VALUES(name), remark = VALUES(remark);

-- 资源类型 5 类（#2）
INSERT INTO sys_dict_item (type_code, item_value, item_label, sort_order) VALUES
    ('RESOURCE_TYPE', 'TECH_SERVICE',        '技术服务', 1),
    ('RESOURCE_TYPE', 'PRODUCT_SERVICE',     '产品服务', 2),
    ('RESOURCE_TYPE', 'SUPPLY_CAPABILITY',   '供应能力', 3),
    ('RESOURCE_TYPE', 'COOPERATION_PROJECT', '合作项目', 4),
    ('RESOURCE_TYPE', 'TALENT_RESOURCE',     '人才资源', 5)
ON DUPLICATE KEY UPDATE item_label = VALUES(item_label), sort_order = VALUES(sort_order);

-- 需求类型 5 类（#11，可在字典管理中继续增加）
INSERT INTO sys_dict_item (type_code, item_value, item_label, sort_order) VALUES
    ('DEMAND_TYPE', 'PURCHASE',   '采购需求', 1),
    ('DEMAND_TYPE', 'TECHNOLOGY', '技术需求', 2),
    ('DEMAND_TYPE', 'BUSINESS',   '业务需求', 3),
    ('DEMAND_TYPE', 'CAPITAL',    '资金需求', 4),
    ('DEMAND_TYPE', 'TALENT',     '人才需求', 5)
ON DUPLICATE KEY UPDATE item_label = VALUES(item_label), sort_order = VALUES(sort_order);

-- ---------------------------------------------------------------------
-- 历史数据值重映射（旧 3 类 → 新类型），保证列表筛选/展示一致
-- 资源：PRODUCT→PRODUCT_SERVICE、TECHNOLOGY→TECH_SERVICE、TALENT→TALENT_RESOURCE
-- 需求：PRODUCT→PURCHASE（TECHNOLOGY/TALENT 新旧同名，无需变更）
-- 注：执行后需重新同步 ES（POST /api/v1/supply/es/sync-all 或对应同步接口）
-- ---------------------------------------------------------------------
UPDATE gl_supply.supply_resource SET type = 'PRODUCT_SERVICE'  WHERE type = 'PRODUCT';
UPDATE gl_supply.supply_resource SET type = 'TECH_SERVICE'     WHERE type = 'TECHNOLOGY';
UPDATE gl_supply.supply_resource SET type = 'TALENT_RESOURCE'  WHERE type = 'TALENT';

UPDATE gl_supply.supply_demand  SET type = 'PURCHASE'          WHERE type = 'PRODUCT';
