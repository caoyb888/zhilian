-- ============================================================
-- 绿产智链（Green-Link）一期全量 DDL
-- 版本：V1.0.0
-- 日期：2026-06-04
-- 说明：含二期预留字段；分区表按月 RANGE 分区
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- Schema: gl_member — 会员与权限域
-- ============================================================
CREATE DATABASE IF NOT EXISTS gl_member
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE gl_member;

-- ---------------------------------------------------------
-- 1. member_unit（会员单位）
-- ---------------------------------------------------------
CREATE TABLE member_unit (
    id              BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    name            VARCHAR(200)     NOT NULL                COMMENT '单位全称',
    short_name      VARCHAR(50)                              COMMENT '单位简称，用于列表展示',
    industry        VARCHAR(100)     NOT NULL                COMMENT '所属行业，值引用标签体系 industry 分类',
    province        VARCHAR(50)                              COMMENT '所在省份',
    city            VARCHAR(50)                              COMMENT '所在城市',
    member_level    TINYINT          NOT NULL DEFAULT 1      COMMENT '会员等级：1普通 2VIP 3理事',
    credit_score    DECIMAL(5,2)     NOT NULL DEFAULT 100.00 COMMENT '信用评分 0–100（预留二期信用评价）',
    logo_url        VARCHAR(500)                             COMMENT 'Logo 图片 URL → file_record.file_url',
    introduction    TEXT                                     COMMENT '单位简介（富文本，XSS 过滤后存储）',
    contact_name    VARCHAR(50)                              COMMENT '主要联系人姓名',
    contact_phone   VARCHAR(20)                              COMMENT '联系电话（接口层脱敏返回）',
    contact_email   VARCHAR(100)                             COMMENT '联系邮箱（接口层脱敏返回）',
    is_certified    TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '绿色认证标识：0否 1是（预留二期）',
    status          TINYINT          NOT NULL DEFAULT 2      COMMENT '状态：0禁用 1正常 2审核中',
    join_date       DATE                                     COMMENT '入会日期',
    is_deleted      TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '软删除：0正常 1已删除',
    created_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    updated_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    INDEX idx_industry       (industry),
    INDEX idx_member_level   (member_level),
    INDEX idx_status         (status),
    INDEX idx_province_city  (province, city),
    INDEX idx_created_at     (created_at)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '会员单位 — 平台核心主体';

-- ---------------------------------------------------------
-- 2. member_account（会员账号）
-- ---------------------------------------------------------
CREATE TABLE member_account (
    id            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    member_id     BIGINT UNSIGNED  NOT NULL                COMMENT '所属会员单位 → member_unit.id',
    parent_id     BIGINT UNSIGNED           DEFAULT NULL   COMMENT '父账号ID，NULL为主账号；集团子账号场景 → member_account.id',
    username      VARCHAR(50)      NOT NULL                COMMENT '登录名，全局唯一',
    password_hash VARCHAR(100)     NOT NULL                COMMENT 'BCrypt 加密密码，禁止 MD5/SHA1',
    phone         VARCHAR(20)                              COMMENT '手机号，可用于验证码登录',
    email         VARCHAR(100)                             COMMENT '邮箱',
    real_name     VARCHAR(50)                              COMMENT '真实姓名',
    avatar_url    VARCHAR(500)                             COMMENT '头像 URL → file_record.file_url',
    openid        VARCHAR(100)                             COMMENT '微信 OpenID，微信端登录绑定',
    fail_count    TINYINT          NOT NULL DEFAULT 0      COMMENT '连续登录失败次数，≥5 触发锁定',
    locked_until  DATETIME                  DEFAULT NULL   COMMENT '账号锁定截止时间，NULL 表示未锁定',
    last_login_at DATETIME                  DEFAULT NULL   COMMENT '最后一次登录时间',
    last_login_ip VARCHAR(50)                              COMMENT '最后一次登录 IP',
    status        TINYINT          NOT NULL DEFAULT 1      COMMENT '状态：0禁用 1正常',
    is_deleted    TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '软删除：0正常 1已删除',
    created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    updated_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_username  (username),
    INDEX idx_member_id     (member_id),
    INDEX idx_parent_id     (parent_id),
    INDEX idx_openid        (openid),
    INDEX idx_phone         (phone),
    INDEX idx_status        (status)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '会员账号 — 含集团主/子账号层级，BCrypt 密码，微信 OpenID 绑定';

-- ---------------------------------------------------------
-- 3. rbac_role（角色）
-- ---------------------------------------------------------
CREATE TABLE rbac_role (
    id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    code        VARCHAR(50)      NOT NULL                COMMENT '角色编码（唯一）：SUPER_ADMIN/AUDITOR/CONTENT_ADMIN/MEMBER/VIP_MEMBER/EXPERT/FINANCE',
    name        VARCHAR(100)     NOT NULL                COMMENT '角色显示名称',
    description VARCHAR(300)                             COMMENT '角色描述',
    is_system   TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '是否系统内置：0否 1是（内置角色不可删除）',
    is_deleted  TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '软删除',
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    updated_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_code (code)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = 'RBAC 角色 — 系统内置角色不可删除';

-- ---------------------------------------------------------
-- 4. rbac_permission（权限项）
-- ---------------------------------------------------------
CREATE TABLE rbac_permission (
    id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    code        VARCHAR(100)     NOT NULL                COMMENT '权限编码（唯一），如 supply:resource:publish / admin:member:approve',
    name        VARCHAR(100)     NOT NULL                COMMENT '权限显示名称',
    type        TINYINT          NOT NULL DEFAULT 1      COMMENT '权限类型：1菜单 2按钮/操作 3数据权限',
    parent_id   BIGINT UNSIGNED           DEFAULT NULL   COMMENT '父权限ID，顶级权限为 NULL → rbac_permission.id',
    sort_order  INT              NOT NULL DEFAULT 0      COMMENT '同级排序序号',
    is_deleted  TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '软删除',
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    updated_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_code    (code),
    INDEX idx_parent_id   (parent_id),
    INDEX idx_type        (type)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = 'RBAC 权限项 — 树形结构，支持菜单/操作/数据三类权限';

-- ---------------------------------------------------------
-- 5. rbac_role_permission（角色权限关联）
-- ---------------------------------------------------------
CREATE TABLE rbac_role_permission (
    id            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    role_id       BIGINT UNSIGNED  NOT NULL                COMMENT '角色ID → rbac_role.id',
    permission_id BIGINT UNSIGNED  NOT NULL                COMMENT '权限ID → rbac_permission.id',
    created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_role_perm  (role_id, permission_id),
    INDEX idx_permission_id  (permission_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = 'RBAC 角色权限关联（多对多）';

-- ---------------------------------------------------------
-- 6. rbac_account_role（账号角色关联）
-- ---------------------------------------------------------
CREATE TABLE rbac_account_role (
    id         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    account_id BIGINT UNSIGNED  NOT NULL                COMMENT '账号ID → member_account.id',
    role_id    BIGINT UNSIGNED  NOT NULL                COMMENT '角色ID → rbac_role.id',
    created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_account_role (account_id, role_id),
    INDEX idx_role_id          (role_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = 'RBAC 账号角色关联（多对多）';

-- ---------------------------------------------------------
-- 7. member_login_log（登录日志）— 按月分区
-- ---------------------------------------------------------
CREATE TABLE member_login_log (
    id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    account_id  BIGINT UNSIGNED  NOT NULL                COMMENT '账号ID → member_account.id',
    login_time  DATETIME         NOT NULL                COMMENT '登录时间',
    ip          VARCHAR(50)                              COMMENT '登录来源 IP',
    terminal    VARCHAR(20)                              COMMENT '终端类型：PC/H5/WECHAT/MINIAPP/APP',
    result      TINYINT          NOT NULL DEFAULT 1      COMMENT '登录结果：0失败 1成功',
    fail_reason VARCHAR(200)                             COMMENT '失败原因（密码错误/账号锁定/验证码错误等）',
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
    PRIMARY KEY (id, login_time),
    INDEX idx_account_id  (account_id),
    INDEX idx_login_time  (login_time),
    INDEX idx_result      (result)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '会员登录日志 — 按月分区，审计用途'
  PARTITION BY RANGE (TO_DAYS(login_time)) (
    PARTITION p_2026_01 VALUES LESS THAN (TO_DAYS('2026-02-01')),
    PARTITION p_2026_02 VALUES LESS THAN (TO_DAYS('2026-03-01')),
    PARTITION p_2026_03 VALUES LESS THAN (TO_DAYS('2026-04-01')),
    PARTITION p_2026_04 VALUES LESS THAN (TO_DAYS('2026-05-01')),
    PARTITION p_2026_05 VALUES LESS THAN (TO_DAYS('2026-06-01')),
    PARTITION p_2026_06 VALUES LESS THAN (TO_DAYS('2026-07-01')),
    PARTITION p_2026_07 VALUES LESS THAN (TO_DAYS('2026-08-01')),
    PARTITION p_2026_08 VALUES LESS THAN (TO_DAYS('2026-09-01')),
    PARTITION p_2026_09 VALUES LESS THAN (TO_DAYS('2026-10-01')),
    PARTITION p_2026_10 VALUES LESS THAN (TO_DAYS('2026-11-01')),
    PARTITION p_2026_11 VALUES LESS THAN (TO_DAYS('2026-12-01')),
    PARTITION p_2026_12 VALUES LESS THAN (TO_DAYS('2027-01-01')),
    PARTITION p_future   VALUES LESS THAN MAXVALUE
  );


-- ============================================================
-- Schema: gl_supply — 供需对接域
-- ============================================================
CREATE DATABASE IF NOT EXISTS gl_supply
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE gl_supply;

-- ---------------------------------------------------------
-- 8. supply_resource（资源发布）
-- ---------------------------------------------------------
CREATE TABLE supply_resource (
    id               BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    member_id        BIGINT UNSIGNED  NOT NULL                COMMENT '发布会员单位 → member_unit.id',
    account_id       BIGINT UNSIGNED  NOT NULL                COMMENT '发布账号 → member_account.id',
    type             VARCHAR(50)      NOT NULL                COMMENT '资源类型：PRODUCT产品 TECHNOLOGY技术 TALENT人才 CARBON碳资产(预留) GREEN_CERT绿证(预留)',
    title            VARCHAR(300)     NOT NULL                COMMENT '资源标题，同步至 ES 检索',
    content          LONGTEXT                                 COMMENT '详细描述（富文本，XSS 过滤后入库）',
    summary          VARCHAR(500)                             COMMENT '摘要（列表展示与 ES 检索用）',
    province         VARCHAR(50)                              COMMENT '所在省份',
    city             VARCHAR(50)                              COMMENT '所在城市',
    cooperation_mode VARCHAR(200)                             COMMENT '合作方式（转让/授权/合作开发/技术服务等）',
    valid_until      DATE                                     COMMENT '资源有效期，NULL 表示长期有效',
    view_count       INT              NOT NULL DEFAULT 0      COMMENT '浏览量（Redis 缓存，定时异步回写）',
    contact_visible  TINYINT(1)       NOT NULL DEFAULT 1      COMMENT '联系方式可见范围：0仅管理员 1已登录会员',
    audit_status     TINYINT          NOT NULL DEFAULT 0      COMMENT '审核状态：0待审核 1通过 2拒绝 3已下架',
    audit_remark     VARCHAR(500)                             COMMENT '审核备注/拒绝原因，会员可见',
    auditor_id       BIGINT UNSIGNED           DEFAULT NULL   COMMENT '审核人账号 → member_account.id',
    audited_at       DATETIME                  DEFAULT NULL   COMMENT '审核操作时间',
    carbon_amount    DECIMAL(15,4)             DEFAULT NULL   COMMENT '碳减排量 tCO₂e（预留二期碳资产模块）',
    cert_type        VARCHAR(100)              DEFAULT NULL   COMMENT '绿色认证类型（预留二期）',
    is_deleted       TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '软删除：0正常 1已删除',
    created_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    updated_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    INDEX idx_member_id    (member_id),
    INDEX idx_account_id   (account_id),
    INDEX idx_type         (type),
    INDEX idx_audit_status (audit_status),
    INDEX idx_province     (province),
    INDEX idx_valid_until  (valid_until),
    INDEX idx_created_at   (created_at),
    INDEX idx_list_query   (audit_status, is_deleted, created_at DESC)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '资源发布 — 会员发布的可供合作的产品/技术/人才等资源';

-- ---------------------------------------------------------
-- 9. supply_demand（需求发布）
-- ---------------------------------------------------------
CREATE TABLE supply_demand (
    id               BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    member_id        BIGINT UNSIGNED  NOT NULL                COMMENT '发布会员单位 → member_unit.id',
    account_id       BIGINT UNSIGNED  NOT NULL                COMMENT '发布账号 → member_account.id',
    type             VARCHAR(50)      NOT NULL                COMMENT '需求类型：PRODUCT产品采购 TECHNOLOGY技术引进 TALENT人才招募 CARBON碳减排需求(预留)',
    title            VARCHAR(300)     NOT NULL                COMMENT '需求标题，同步至 ES 检索',
    content          LONGTEXT                                 COMMENT '需求详细描述（富文本，XSS 过滤后入库）',
    summary          VARCHAR(500)                             COMMENT '摘要（列表展示与 ES 检索用）',
    province         VARCHAR(50)                              COMMENT '期望合作方所在省份',
    budget_min       DECIMAL(15,2)             DEFAULT NULL   COMMENT '预算下限（万元），NULL 表示面议',
    budget_max       DECIMAL(15,2)             DEFAULT NULL   COMMENT '预算上限（万元），NULL 表示面议',
    deadline         DATE                                     COMMENT '需求截止日期',
    cooperation_mode VARCHAR(200)                             COMMENT '期望合作方式',
    view_count       INT              NOT NULL DEFAULT 0      COMMENT '浏览量（Redis 缓存，定时回写）',
    audit_status     TINYINT          NOT NULL DEFAULT 0      COMMENT '审核状态：0待审核 1通过 2拒绝 3已关闭',
    audit_remark     VARCHAR(500)                             COMMENT '审核备注/拒绝原因',
    auditor_id       BIGINT UNSIGNED           DEFAULT NULL   COMMENT '审核人账号 → member_account.id',
    audited_at       DATETIME                  DEFAULT NULL   COMMENT '审核时间',
    is_deleted       TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '软删除',
    created_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    updated_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    INDEX idx_member_id    (member_id),
    INDEX idx_type         (type),
    INDEX idx_audit_status (audit_status),
    INDEX idx_deadline     (deadline),
    INDEX idx_created_at   (created_at),
    INDEX idx_list_query   (audit_status, is_deleted, created_at DESC)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '需求发布 — 会员发布的采购/合作/引进等需求';

-- ---------------------------------------------------------
-- 10. supply_attachment（附件）
-- ---------------------------------------------------------
CREATE TABLE supply_attachment (
    id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    biz_type    VARCHAR(20)      NOT NULL                COMMENT '业务类型：RESOURCE资源 DEMAND需求',
    biz_id      BIGINT UNSIGNED  NOT NULL                COMMENT '关联业务ID（supply_resource.id 或 supply_demand.id）',
    file_name   VARCHAR(300)     NOT NULL                COMMENT '原始文件名（展示用）',
    file_url    VARCHAR(500)     NOT NULL                COMMENT '文件访问 URL → file_record.file_url',
    file_size   BIGINT                    DEFAULT NULL   COMMENT '文件大小（字节）',
    file_type   VARCHAR(50)                              COMMENT '文件 MIME 类型，如 image/jpeg / application/pdf',
    sort_order  INT              NOT NULL DEFAULT 0      COMMENT '同一业务下附件排序序号',
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    PRIMARY KEY (id),
    INDEX idx_biz (biz_type, biz_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '资源/需求附件 — 多态关联，biz_type+biz_id 定位所属业务';


-- ============================================================
-- Schema: gl_match — 匹配对接域
-- ============================================================
CREATE DATABASE IF NOT EXISTS gl_match
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE gl_match;

-- ---------------------------------------------------------
-- 11. match_record（匹配对接记录）
-- ---------------------------------------------------------
CREATE TABLE match_record (
    id                 BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    resource_id        BIGINT UNSIGNED  NOT NULL                COMMENT '资源ID → supply_resource.id',
    demand_id          BIGINT UNSIGNED  NOT NULL                COMMENT '需求ID → supply_demand.id',
    resource_member_id BIGINT UNSIGNED  NOT NULL                COMMENT '资源方会员ID → member_unit.id（冗余，避免跨库JOIN）',
    demand_member_id   BIGINT UNSIGNED  NOT NULL                COMMENT '需求方会员ID → member_unit.id（冗余）',
    match_score        DECIMAL(5,2)              DEFAULT NULL   COMMENT '系统匹配度得分 0–100，主动申请为 NULL',
    match_type         TINYINT          NOT NULL DEFAULT 1      COMMENT '匹配来源：1系统推荐 2主动申请',
    status             TINYINT          NOT NULL DEFAULT 1      COMMENT '对接状态：1待响应 2已接受 3洽谈中 4已签约(预留) 5已完成 6已拒绝 7已撤销',
    initiator_id       BIGINT UNSIGNED  NOT NULL                COMMENT '申请发起方账号 → member_account.id',
    apply_message      VARCHAR(1000)             DEFAULT NULL   COMMENT '发起方申请留言',
    contract_id        BIGINT UNSIGNED           DEFAULT NULL   COMMENT '关联合同ID（预留二期线上签约）',
    evaluation_done    TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '是否已完成双方互评（预留二期信用评价）',
    is_deleted         TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '软删除',
    created_at         DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间（申请时间）',
    updated_at         DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '状态最后更新时间',
    PRIMARY KEY (id),
    INDEX idx_resource_id      (resource_id),
    INDEX idx_demand_id        (demand_id),
    INDEX idx_resource_member  (resource_member_id, status),
    INDEX idx_demand_member    (demand_member_id, status),
    INDEX idx_status           (status),
    INDEX idx_created_at       (created_at)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '匹配对接记录 — 供需闭环核心流水，状态机驱动全流程';

-- ---------------------------------------------------------
-- 12. match_message（对接沟通消息）— 按月分区
-- ---------------------------------------------------------
CREATE TABLE match_message (
    id         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    match_id   BIGINT UNSIGNED  NOT NULL                COMMENT '所属对接记录 → match_record.id',
    sender_id  BIGINT UNSIGNED  NOT NULL                COMMENT '发送方账号 → member_account.id',
    content    TEXT             NOT NULL                COMMENT '消息正文（文本时为文字，附件时为文件名）',
    msg_type   TINYINT          NOT NULL DEFAULT 1      COMMENT '消息类型：1文本 2图片 3附件',
    attach_url VARCHAR(500)              DEFAULT NULL   COMMENT '附件访问 URL，msg_type=2/3 时有值',
    is_read    TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '接收方已读标志：0未读 1已读',
    created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
    PRIMARY KEY (id, created_at),
    INDEX idx_match_id   (match_id),
    INDEX idx_sender_id  (sender_id),
    INDEX idx_is_read    (match_id, is_read)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '对接沟通消息 — 留痕记录，按月分区'
  PARTITION BY RANGE (TO_DAYS(created_at)) (
    PARTITION p_2026_01 VALUES LESS THAN (TO_DAYS('2026-02-01')),
    PARTITION p_2026_02 VALUES LESS THAN (TO_DAYS('2026-03-01')),
    PARTITION p_2026_03 VALUES LESS THAN (TO_DAYS('2026-04-01')),
    PARTITION p_2026_04 VALUES LESS THAN (TO_DAYS('2026-05-01')),
    PARTITION p_2026_05 VALUES LESS THAN (TO_DAYS('2026-06-01')),
    PARTITION p_2026_06 VALUES LESS THAN (TO_DAYS('2026-07-01')),
    PARTITION p_2026_07 VALUES LESS THAN (TO_DAYS('2026-08-01')),
    PARTITION p_2026_08 VALUES LESS THAN (TO_DAYS('2026-09-01')),
    PARTITION p_2026_09 VALUES LESS THAN (TO_DAYS('2026-10-01')),
    PARTITION p_2026_10 VALUES LESS THAN (TO_DAYS('2026-11-01')),
    PARTITION p_2026_11 VALUES LESS THAN (TO_DAYS('2026-12-01')),
    PARTITION p_2026_12 VALUES LESS THAN (TO_DAYS('2027-01-01')),
    PARTITION p_future   VALUES LESS THAN MAXVALUE
  );

-- ---------------------------------------------------------
-- 13. match_favorite（收藏记录）
-- ---------------------------------------------------------
CREATE TABLE match_favorite (
    id         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    account_id BIGINT UNSIGNED  NOT NULL                COMMENT '收藏账号 → member_account.id',
    biz_type   VARCHAR(20)      NOT NULL                COMMENT '业务类型：RESOURCE资源 DEMAND需求',
    biz_id     BIGINT UNSIGNED  NOT NULL                COMMENT '关联业务ID',
    created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_fav       (account_id, biz_type, biz_id),
    INDEX idx_account_type  (account_id, biz_type)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '收藏记录 — 账号对资源/需求的收藏，唯一约束防重复';


-- ============================================================
-- Schema: gl_portal — 门户内容域
-- ============================================================
CREATE DATABASE IF NOT EXISTS gl_portal
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE gl_portal;

-- ---------------------------------------------------------
-- 14. portal_category（门户栏目）
-- ---------------------------------------------------------
CREATE TABLE portal_category (
    id         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    parent_id  BIGINT UNSIGNED           DEFAULT NULL   COMMENT '父栏目ID，顶级栏目为 NULL → portal_category.id',
    name       VARCHAR(100)     NOT NULL                COMMENT '栏目显示名称',
    code       VARCHAR(50)      NOT NULL                COMMENT '栏目编码（唯一）：NEWS新闻 NOTICE通知 POLICY政策法规 ACTIVITY活动',
    sort_order INT              NOT NULL DEFAULT 0      COMMENT '同级排序序号',
    is_visible TINYINT(1)       NOT NULL DEFAULT 1      COMMENT '前台是否可见：0隐藏 1显示',
    created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    updated_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_code     (code),
    INDEX idx_parent_id    (parent_id),
    INDEX idx_is_visible   (is_visible)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '门户栏目 — 树形结构，支持多级分类';

-- ---------------------------------------------------------
-- 15. portal_article（门户文章）
-- ---------------------------------------------------------
CREATE TABLE portal_article (
    id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    category_id  BIGINT UNSIGNED  NOT NULL                COMMENT '所属栏目 → portal_category.id',
    title        VARCHAR(300)     NOT NULL                COMMENT '文章标题，同步至 ES 检索',
    content      LONGTEXT                                 COMMENT '正文（富文本，XSS 过滤后入库）',
    summary      VARCHAR(500)                             COMMENT '摘要（列表展示与 ES 检索用，可自动截取）',
    cover_url    VARCHAR(500)                             COMMENT '封面图 URL → file_record.file_url',
    author       VARCHAR(100)                             COMMENT '作者/来源机构名称',
    source_url   VARCHAR(500)                             COMMENT '原文链接（转载时填写）',
    view_count   INT              NOT NULL DEFAULT 0      COMMENT '浏览量（Redis 缓存，定时回写）',
    is_top       TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '是否栏目置顶：0否 1是',
    is_published TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '是否已发布：0草稿 1已发布',
    published_at DATETIME                  DEFAULT NULL   COMMENT '发布时间（支持定时发布）',
    publisher_id BIGINT UNSIGNED           DEFAULT NULL   COMMENT '发布操作人账号 → member_account.id',
    is_deleted   TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '软删除',
    created_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    updated_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    INDEX idx_category_id   (category_id, is_published, is_deleted),
    INDEX idx_published_at  (published_at),
    INDEX idx_is_top        (category_id, is_top, published_at DESC),
    INDEX idx_created_at    (created_at)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '门户文章 — 新闻/通知/政策法规共用，支持草稿和定时发布';

-- ---------------------------------------------------------
-- 16. portal_banner（首页轮播图）
-- ---------------------------------------------------------
CREATE TABLE portal_banner (
    id         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    title      VARCHAR(200)     NOT NULL                COMMENT '轮播图标题（可选展示）',
    image_url  VARCHAR(500)     NOT NULL                COMMENT '图片 URL → file_record.file_url',
    link_url   VARCHAR(500)                             COMMENT '点击跳转链接，NULL 表示不跳转',
    link_type  TINYINT          NOT NULL DEFAULT 1      COMMENT '链接类型：1内部页面 2外部链接',
    sort_order INT              NOT NULL DEFAULT 0      COMMENT '展示排序序号，越小越靠前',
    show_start DATETIME                  DEFAULT NULL   COMMENT '展示开始时间，NULL 表示立即生效',
    show_end   DATETIME                  DEFAULT NULL   COMMENT '展示结束时间，NULL 表示永久有效',
    is_active  TINYINT(1)       NOT NULL DEFAULT 1      COMMENT '是否启用：0停用 1启用',
    is_deleted TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '软删除',
    created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    updated_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    INDEX idx_active_sort (is_active, sort_order)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '首页轮播图 — 支持定时展示区间配置';

-- ---------------------------------------------------------
-- 17. portal_activity（活动）
-- ---------------------------------------------------------
CREATE TABLE portal_activity (
    id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    title        VARCHAR(300)     NOT NULL                COMMENT '活动标题',
    content      LONGTEXT                                 COMMENT '活动详情（富文本）',
    cover_url    VARCHAR(500)                             COMMENT '活动封面图 URL',
    location     VARCHAR(300)                             COMMENT '活动地点（线上活动可填"线上"）',
    start_time   DATETIME                  DEFAULT NULL   COMMENT '活动开始时间',
    end_time     DATETIME                  DEFAULT NULL   COMMENT '活动结束时间',
    reg_deadline DATETIME                  DEFAULT NULL   COMMENT '报名截止时间，NULL 表示无截止',
    max_capacity INT                       DEFAULT NULL   COMMENT '最大报名容量，NULL 表示不限人数',
    reg_count    INT              NOT NULL DEFAULT 0      COMMENT '当前报名人数（冗余字段，定时同步）',
    status       TINYINT          NOT NULL DEFAULT 1      COMMENT '活动状态：1筹备中 2报名中 3进行中 4已结束 5已取消',
    is_deleted   TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '软删除',
    created_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    updated_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    INDEX idx_status       (status),
    INDEX idx_start_time   (start_time),
    INDEX idx_reg_deadline (reg_deadline)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '活动 — 协会线上线下活动管理，支持报名容量控制';

-- ---------------------------------------------------------
-- 18. portal_activity_signup（活动报名）
-- ---------------------------------------------------------
CREATE TABLE portal_activity_signup (
    id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    activity_id BIGINT UNSIGNED  NOT NULL                COMMENT '活动ID → portal_activity.id',
    account_id  BIGINT UNSIGNED  NOT NULL                COMMENT '报名账号 → member_account.id',
    member_id   BIGINT UNSIGNED  NOT NULL                COMMENT '报名会员单位 → member_unit.id（冗余）',
    remark      VARCHAR(500)              DEFAULT NULL   COMMENT '报名备注（如参会人数、特殊需求等）',
    status      TINYINT          NOT NULL DEFAULT 1      COMMENT '报名状态：1已报名 2已签到 3已取消',
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_signup         (activity_id, account_id),
    INDEX idx_activity_status    (activity_id, status),
    INDEX idx_account_id         (account_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '活动报名 — 唯一约束防止重复报名，支持签到状态管理';


-- ============================================================
-- Schema: gl_common — 公共支撑域
-- ============================================================
CREATE DATABASE IF NOT EXISTS gl_common
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE gl_common;

-- ---------------------------------------------------------
-- 19. tag_category（标签分类）
-- ---------------------------------------------------------
CREATE TABLE tag_category (
    id         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    name       VARCHAR(100)     NOT NULL                COMMENT '分类显示名称',
    code       VARCHAR(50)      NOT NULL                COMMENT '分类编码（唯一）：INDUSTRY行业 RESOURCE资源类型 DEMAND需求类型 POLICY政策领域 CERT认证类型 TECH_FIELD技术领域',
    sort_order INT              NOT NULL DEFAULT 0      COMMENT '展示排序序号',
    is_active  TINYINT(1)       NOT NULL DEFAULT 1      COMMENT '是否启用：0停用 1启用',
    created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    updated_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_code (code)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '标签分类 — 管理标签的一级分组，各业务模块按分类获取对应标签';

-- ---------------------------------------------------------
-- 20. tag（标签）
-- ---------------------------------------------------------
CREATE TABLE tag (
    id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    category_id BIGINT UNSIGNED  NOT NULL                COMMENT '所属分类 → tag_category.id',
    name        VARCHAR(100)     NOT NULL                COMMENT '标签名称（如"节能环保""新能源""碳中和"）',
    alias       VARCHAR(300)              DEFAULT NULL   COMMENT '同义词列表，英文逗号分隔（辅助 ES 搜索召回）',
    is_active   TINYINT(1)       NOT NULL DEFAULT 1      COMMENT '是否启用：0停用 1启用',
    sort_order  INT              NOT NULL DEFAULT 0      COMMENT '同分类内排序序号',
    is_deleted  TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '软删除',
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP                    COMMENT '创建时间',
    updated_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    INDEX idx_category_id   (category_id, is_active),
    INDEX idx_name          (name)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '标签 — 支持同义词辅助搜索，由协会管理端统一维护';

-- ---------------------------------------------------------
-- 21. tag_relation（业务标签关联）
-- ---------------------------------------------------------
CREATE TABLE tag_relation (
    id         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    biz_type   VARCHAR(30)      NOT NULL                COMMENT '业务类型：RESOURCE资源 DEMAND需求 MEMBER会员单位 ARTICLE文章 ACTIVITY活动',
    biz_id     BIGINT UNSIGNED  NOT NULL                COMMENT '关联业务ID（对应 biz_type 所指业务表的主键）',
    tag_id     BIGINT UNSIGNED  NOT NULL                COMMENT '标签ID → tag.id',
    created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '关联时间（发布或打标时间）',
    PRIMARY KEY (id),
    UNIQUE KEY uk_tag_rel    (biz_type, biz_id, tag_id),
    INDEX idx_tag_id         (tag_id),
    INDEX idx_biz_type_id    (biz_type, biz_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '业务标签关联 — 多态设计支持所有业务实体打标，是匹配引擎标签召回的数据基础';

-- ---------------------------------------------------------
-- 22. message_notification（消息通知）— 按月分区
-- ---------------------------------------------------------
CREATE TABLE message_notification (
    id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    account_id  BIGINT UNSIGNED  NOT NULL                COMMENT '消息接收账号 → member_account.id',
    biz_type    VARCHAR(50)               DEFAULT NULL   COMMENT '业务类型：MATCH对接 AUDIT审核 ACTIVITY活动 SYSTEM系统公告',
    biz_id      BIGINT UNSIGNED           DEFAULT NULL   COMMENT '关联业务ID（对应 biz_type 所指业务的主键）',
    title       VARCHAR(200)     NOT NULL                COMMENT '消息标题（站内信和微信模板消息共用）',
    content     TEXT                                     COMMENT '消息正文（站内信详情）',
    channel     VARCHAR(20)      NOT NULL DEFAULT 'SITE' COMMENT '发送渠道：SITE站内信 WECHAT微信模板消息',
    is_read     TINYINT(1)       NOT NULL DEFAULT 0      COMMENT '已读状态：0未读 1已读（仅站内信有效）',
    read_at     DATETIME                  DEFAULT NULL   COMMENT '已读时间',
    send_status TINYINT          NOT NULL DEFAULT 0      COMMENT '发送状态：0待发送 1已发送 2发送失败',
    send_at     DATETIME                  DEFAULT NULL   COMMENT '实际发送时间',
    fail_reason VARCHAR(300)              DEFAULT NULL   COMMENT '发送失败原因',
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '消息创建时间',
    PRIMARY KEY (id, created_at),
    INDEX idx_account_unread   (account_id, is_read, created_at DESC),
    INDEX idx_send_pending     (channel, send_status, created_at),
    INDEX idx_biz              (biz_type, biz_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '消息通知 — 站内信与微信模板消息统一管理，按月分区'
  PARTITION BY RANGE (TO_DAYS(created_at)) (
    PARTITION p_2026_01 VALUES LESS THAN (TO_DAYS('2026-02-01')),
    PARTITION p_2026_02 VALUES LESS THAN (TO_DAYS('2026-03-01')),
    PARTITION p_2026_03 VALUES LESS THAN (TO_DAYS('2026-04-01')),
    PARTITION p_2026_04 VALUES LESS THAN (TO_DAYS('2026-05-01')),
    PARTITION p_2026_05 VALUES LESS THAN (TO_DAYS('2026-06-01')),
    PARTITION p_2026_06 VALUES LESS THAN (TO_DAYS('2026-07-01')),
    PARTITION p_2026_07 VALUES LESS THAN (TO_DAYS('2026-08-01')),
    PARTITION p_2026_08 VALUES LESS THAN (TO_DAYS('2026-09-01')),
    PARTITION p_2026_09 VALUES LESS THAN (TO_DAYS('2026-10-01')),
    PARTITION p_2026_10 VALUES LESS THAN (TO_DAYS('2026-11-01')),
    PARTITION p_2026_11 VALUES LESS THAN (TO_DAYS('2026-12-01')),
    PARTITION p_2026_12 VALUES LESS THAN (TO_DAYS('2027-01-01')),
    PARTITION p_future   VALUES LESS THAN MAXVALUE
  );

-- ---------------------------------------------------------
-- 23. file_record（文件上传记录）
-- ---------------------------------------------------------
CREATE TABLE file_record (
    id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
    uploader_id BIGINT UNSIGNED  NOT NULL                COMMENT '上传账号 → member_account.id',
    biz_type    VARCHAR(30)               DEFAULT NULL   COMMENT '业务类型：RESOURCE资源 DEMAND需求 MEMBER会员 ARTICLE文章 AVATAR头像',
    biz_id      BIGINT UNSIGNED           DEFAULT NULL   COMMENT '关联业务ID（可为空，先上传后关联场景）',
    file_name   VARCHAR(300)     NOT NULL                COMMENT '原始文件名（展示用，不作为访问路径）',
    storage_key VARCHAR(500)     NOT NULL                COMMENT 'MinIO/OSS 对象存储 Key（UUID 命名，防路径遍历）',
    file_url    VARCHAR(500)     NOT NULL                COMMENT '文件可访问 URL（预签名 URL 或 CDN 地址）',
    file_size   BIGINT                    DEFAULT NULL   COMMENT '文件大小（字节）',
    mime_type   VARCHAR(100)              DEFAULT NULL   COMMENT '文件 MIME 类型，如 image/png / application/pdf',
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    PRIMARY KEY (id),
    INDEX idx_uploader_id (uploader_id),
    INDEX idx_biz         (biz_type, biz_id),
    INDEX idx_storage_key (storage_key)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '文件上传记录 — storage_key 使用 UUID 命名防遍历，统一管理所有业务附件';


-- ============================================================
-- 基础数据导入
-- ============================================================

-- ---------------------------------------------------------
-- 1. RBAC 内置角色（gl_member.rbac_role）
-- ---------------------------------------------------------
USE gl_member;

INSERT INTO rbac_role (code, name, description, is_system) VALUES
('SUPER_ADMIN',   '超级管理员', '协会 IT 管理员，全权限', 1),
('CONTENT_ADMIN', '内容管理员', '门户文章/活动发布与管理', 1),
('AUDITOR',       '审核管理员', '会员信息与供需内容审核', 1),
('MEMBER',        '普通会员',   '标准会员操作权限', 1),
('VIP_MEMBER',    'VIP 会员',   '增强匹配与展示权限（二期扩展）', 1),
('EXPERT',        '智库专家',   '专家咨询功能（二期）', 1),
('FINANCE',       '金融机构',   '绿金对接功能（二期）', 1);

-- ---------------------------------------------------------
-- 2. 门户栏目（gl_portal.portal_category）
-- ---------------------------------------------------------
USE gl_portal;

INSERT INTO portal_category (name, code, sort_order, is_visible) VALUES
('行业资讯', 'NEWS',     1, 1),
('协会通知', 'NOTICE',   2, 1),
('政策法规', 'POLICY',   3, 1),
('活动专区', 'ACTIVITY', 4, 1);

-- ---------------------------------------------------------
-- 3. 标签分类（gl_common.tag_category）
-- ---------------------------------------------------------
USE gl_common;

INSERT INTO tag_category (name, code, sort_order, is_active) VALUES
('行业领域',   'INDUSTRY',    1, 1),
('资源类型',   'RESOURCE',    2, 1),
('需求类型',   'DEMAND',      3, 1),
('政策领域',   'POLICY',      4, 1),
('认证类型',   'CERT',        5, 1),
('技术领域',   'TECH_FIELD',  6, 1);

-- ---------------------------------------------------------
-- 4. Flyway Schema History（各数据库）
-- ---------------------------------------------------------
-- 为支持 Flyway 版本管理，在各数据库创建历史记录表
-- 实际项目中由 Flyway 自动创建，此处预先初始化标记 V1.0.0

USE gl_member;
CREATE TABLE IF NOT EXISTS flyway_schema_history (
    installed_rank INT NOT NULL,
    version VARCHAR(50),
    description VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    script VARCHAR(1000) NOT NULL,
    checksum INT,
    installed_by VARCHAR(100) NOT NULL,
    installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time INT NOT NULL,
    success TINYINT(1) NOT NULL,
    PRIMARY KEY (installed_rank),
    INDEX idx_version (version),
    INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Flyway 版本历史';

USE gl_supply;
CREATE TABLE IF NOT EXISTS flyway_schema_history (
    installed_rank INT NOT NULL,
    version VARCHAR(50),
    description VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    script VARCHAR(1000) NOT NULL,
    checksum INT,
    installed_by VARCHAR(100) NOT NULL,
    installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time INT NOT NULL,
    success TINYINT(1) NOT NULL,
    PRIMARY KEY (installed_rank),
    INDEX idx_version (version),
    INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Flyway 版本历史';

USE gl_match;
CREATE TABLE IF NOT EXISTS flyway_schema_history (
    installed_rank INT NOT NULL,
    version VARCHAR(50),
    description VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    script VARCHAR(1000) NOT NULL,
    checksum INT,
    installed_by VARCHAR(100) NOT NULL,
    installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time INT NOT NULL,
    success TINYINT(1) NOT NULL,
    PRIMARY KEY (installed_rank),
    INDEX idx_version (version),
    INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Flyway 版本历史';

USE gl_portal;
CREATE TABLE IF NOT EXISTS flyway_schema_history (
    installed_rank INT NOT NULL,
    version VARCHAR(50),
    description VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    script VARCHAR(1000) NOT NULL,
    checksum INT,
    installed_by VARCHAR(100) NOT NULL,
    installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time INT NOT NULL,
    success TINYINT(1) NOT NULL,
    PRIMARY KEY (installed_rank),
    INDEX idx_version (version),
    INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Flyway 版本历史';

USE gl_common;
CREATE TABLE IF NOT EXISTS flyway_schema_history (
    installed_rank INT NOT NULL,
    version VARCHAR(50),
    description VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    script VARCHAR(1000) NOT NULL,
    checksum INT,
    installed_by VARCHAR(100) NOT NULL,
    installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time INT NOT NULL,
    success TINYINT(1) NOT NULL,
    PRIMARY KEY (installed_rank),
    INDEX idx_version (version),
    INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Flyway 版本历史';

-- 标记 V1.0.0 已执行
INSERT INTO gl_member.flyway_schema_history
(installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
VALUES (1, '1.0.0', 'init', 'SQL', 'V1.0.0__init.sql', NULL, 'greenlink', 0, 1);

INSERT INTO gl_supply.flyway_schema_history
(installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
VALUES (1, '1.0.0', 'init', 'SQL', 'V1.0.0__init.sql', NULL, 'greenlink', 0, 1);

INSERT INTO gl_match.flyway_schema_history
(installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
VALUES (1, '1.0.0', 'init', 'SQL', 'V1.0.0__init.sql', NULL, 'greenlink', 0, 1);

INSERT INTO gl_portal.flyway_schema_history
(installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
VALUES (1, '1.0.0', 'init', 'SQL', 'V1.0.0__init.sql', NULL, 'greenlink', 0, 1);

INSERT INTO gl_common.flyway_schema_history
(installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
VALUES (1, '1.0.0', 'init', 'SQL', 'V1.0.0__init.sql', NULL, 'greenlink', 0, 1);

SET FOREIGN_KEY_CHECKS = 1;
