# CLAUDE.md — 绿产智链（Green-Link）一期开发行为规范

> 项目：山东省绿色低碳产业生态智慧链接平台（绿产智链 Green-Link）  
> 阶段：一期（基础搭台，约 4–5 个月）  
> 本文件是 AI 辅助编码时的强制性行为约束，所有代码生成、修改、评审均须遵守。

---

## 一、项目概览

### 1.1 系统定位

绿产智链是山东省绿色低碳产业协会的数字化运营平台，核心目标是构建"资源聚合 → 智能匹配 → 在线对接 → 成交归档"的全流程供需闭环，同时支撑协会门户内容管理与协会管理后台。

### 1.2 一期交付范围

| 子系统 | 说明 |
|---|---|
| 公共支撑层 | 用户中心（SSO）、RBAC 权限、标签体系、全文搜索 |
| 门户网站 | 新闻、通知、政策文章、活动展示（前台） |
| 供需对接平台（会员端） | 资源/需求发布、智能匹配、在线对接、消息推送 |
| 供需对接平台（管理端） | 会员管理、内容审核、数据看板 |
| 微信基础推送 | 微信服务号模板消息通知 |

> 碳资产/绿证、专家智库、产业指数、线上签约、信用评价等**属于二期范围**，一期不开发，但数据库须为其预留字段。

---

## 二、技术栈约束

### 2.1 后端（严格遵守，不得替换）

| 层次 | 技术 | 版本 |
|---|---|---|
| 框架基座 | Spring Boot | 3.x |
| 微服务 | Spring Cloud | 对应 Spring Boot 3.x 版本 |
| 注册配置 | Nacos | 最新稳定版 |
| 网关 | Spring Cloud Gateway | — |
| 鉴权 | Spring Security + JWT + OAuth2 | — |
| 搜索 | Elasticsearch + IK 分词 | 8.x |
| 缓存 | Redis | 7.x |
| 消息 | RocketMQ | — |
| 主业务库 | MySQL | 8.x（主从配置） |
| 分析库 | ClickHouse | 预留，一期可不部署 |
| 文件存储 | MinIO（本地开发）/ 阿里云 OSS（生产） | — |
| 微信对接 | WxJava SDK | 最新稳定版 |
| 容器化 | Docker + Kubernetes | — |
| CI/CD | Jenkins | — |
| 链路追踪 | SkyWalking | — |
| 日志 | ELK（Elasticsearch + Logstash + Kibana） | — |
| 监控 | Prometheus + Grafana | — |
| 熔断 | Sentinel | — |

**禁止**使用上述清单之外的框架替换品（如 Quarkus、Micronaut、Dubbo 替代 Spring Cloud 等），如有合理需要须提交架构变更评审。

### 2.2 前端（严格遵守，不得替换）

| 层次 | 技术 | 版本 |
|---|---|---|
| 框架 | React | 18.x |
| 构建工具 | Vite | 最新稳定版 |
| 样式 | Tailwind CSS | 3.x |
| 状态管理（全局） | Zustand | — |
| 服务端状态 | React Query（TanStack Query） | v5.x |
| UI 组件 | Headless UI + 自研组件库 | — |
| 微信端 | 同一套 React H5 内嵌服务号/企业微信 | — |

**禁止**引入 Ant Design、Element Plus、MUI 等重量级组件库；所有组件基于 Headless UI + Tailwind 自研皮肤。

---

## 三、架构分层规范

### 3.1 整体分层（五层架构）

```
接入层   →  PC 浏览器 / 平板 / 手机 H5 / 微信端（同一套 React 代码）
网关层   →  Spring Cloud Gateway（路由 / 鉴权 / 限流）
业务层   →  各微服务（按业务域拆分，见 §3.2）
支撑层   →  用户中心 / 权限 / 标签 / 搜索 / 文件（共享服务）
数据层   →  MySQL / Redis / Elasticsearch / MinIO / ClickHouse（预留）
```

### 3.2 一期微服务拆分

| 服务名 | 职责 | 数据库 Schema |
|---|---|---|
| `gl-gateway` | API 网关，路由/鉴权/限流 | — |
| `gl-auth` | OAuth2 + JWT，SSO 用户中心 | `gl_auth` |
| `gl-member` | 会员单位、账号、集团子账号 | `gl_member` |
| `gl-portal` | 门户新闻/通知/政策/活动（CMS） | `gl_portal` |
| `gl-supply` | 资源/需求发布、审核、搜索 | `gl_supply` |
| `gl-match` | 智能匹配引擎（召回 + 排序） | `gl_match` |
| `gl-message` | 站内信、微信模板消息 | `gl_message` |
| `gl-tag` | 标签体系：标签分类、标签、业务标签关联 | `gl_common` |
| `gl-admin` | 协会管理端 BFF（聚合各服务） | — |
| `gl-file` | 文件上传/下载（MinIO/OSS 封装） | `gl_file` |

**规则：**
- 服务间通信优先使用 **OpenFeign**（同步），异步解耦使用 **RocketMQ**。
- 禁止服务间直接访问对方数据库，必须通过 HTTP/RPC 接口。
- 公共能力（标签、搜索、权限）下沉至支撑层，业务服务调用不得重复实现。

### 3.3 前端工程结构

```
src/
├── components/         # 原子组件（Button、Input、Modal …）
├── business/           # 业务组件（ResourceCard、MatchPanel …）
├── pages/              # 页面模板（路由级，懒加载）
│   ├── portal/         # 门户前台
│   ├── supply/         # 供需对接（会员端）
│   └── admin/          # 协会管理端
├── hooks/              # 自定义 Hooks
├── stores/             # Zustand 全局状态
├── services/           # React Query + axios 封装（API 层）
├── utils/              # 纯工具函数
└── tailwind.config.js  # 设计令牌统一配置
```

---

## 四、统一数据库设计规范

### 4.1 全局约定

- **字符集**：`utf8mb4`，排序规则 `utf8mb4_unicode_ci`
- **引擎**：InnoDB
- **主键**：所有表使用 `BIGINT UNSIGNED` 自增主键，字段名 `id`
- **时间字段**：所有表必须包含 `created_at DATETIME DEFAULT CURRENT_TIMESTAMP` 和 `updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
- **软删除**：所有业务表加 `is_deleted TINYINT(1) DEFAULT 0`，禁止物理删除
- **命名风格**：表名、字段名一律 **snake_case**，表名以服务域前缀区分（`member_`、`supply_`、`portal_` 等）
- **外键约束**：不在数据库层面添加外键，关联关系由应用层保证（微服务跨库场景）

### 4.2 核心表设计

#### Schema: `gl_member`

```sql
-- 会员单位
CREATE TABLE member_unit (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(200)    NOT NULL COMMENT '单位名称',
    short_name      VARCHAR(50)     COMMENT '简称',
    industry        VARCHAR(100)    NOT NULL COMMENT '所属行业（关联标签）',
    province        VARCHAR(50)     COMMENT '省份',
    city            VARCHAR(50)     COMMENT '城市',
    member_level    TINYINT         NOT NULL DEFAULT 1 COMMENT '会员等级 1普通 2VIP 3理事',
    credit_score    DECIMAL(5,2)    NOT NULL DEFAULT 100.00 COMMENT '信用评分（预留二期）',
    logo_url        VARCHAR(500)    COMMENT 'Logo 附件 URL',
    introduction    TEXT            COMMENT '简介',
    contact_name    VARCHAR(50)     COMMENT '联系人',
    contact_phone   VARCHAR(20)     COMMENT '联系电话',
    contact_email   VARCHAR(100)    COMMENT '邮箱',
    is_certified    TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '是否绿色认证（预留二期）',
    status          TINYINT         NOT NULL DEFAULT 1 COMMENT '状态 0禁用 1正常 2审核中',
    join_date       DATE            COMMENT '入会日期',
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_industry (industry),
    INDEX idx_member_level (member_level),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员单位';

-- 账号（含集团主/子账号）
CREATE TABLE member_account (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    member_id       BIGINT UNSIGNED NOT NULL COMMENT '所属会员单位',
    parent_id       BIGINT UNSIGNED DEFAULT NULL COMMENT '父账号ID（集团子账号场景）',
    username        VARCHAR(50)     NOT NULL UNIQUE COMMENT '登录名',
    password_hash   VARCHAR(100)    NOT NULL COMMENT 'BCrypt 加密密码',
    phone           VARCHAR(20)     COMMENT '手机号',
    email           VARCHAR(100)    COMMENT '邮箱',
    real_name       VARCHAR(50)     COMMENT '真实姓名',
    avatar_url      VARCHAR(500)    COMMENT '头像',
    openid          VARCHAR(100)    COMMENT '微信 OpenID',
    fail_count      TINYINT         NOT NULL DEFAULT 0 COMMENT '连续登录失败次数',
    locked_until    DATETIME        COMMENT '锁定截止时间',
    last_login_at   DATETIME        COMMENT '最后登录时间',
    last_login_ip   VARCHAR(50)     COMMENT '最后登录IP',
    status          TINYINT         NOT NULL DEFAULT 1 COMMENT '0禁用 1正常',
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_member_id (member_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员账号（含集团子账号）';

-- 角色
CREATE TABLE rbac_role (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50)     NOT NULL UNIQUE COMMENT '角色编码 SUPER_ADMIN / AUDITOR / MEMBER / VIP_MEMBER / EXPERT / FINANCE',
    name        VARCHAR(100)    NOT NULL COMMENT '角色名称',
    description VARCHAR(300)    COMMENT '描述',
    is_system   TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '是否系统内置，内置角色不可删除',
    is_deleted  TINYINT(1)      NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='RBAC 角色';

-- 账号-角色关联
CREATE TABLE rbac_account_role (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_id  BIGINT UNSIGNED NOT NULL,
    role_id     BIGINT UNSIGNED NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_account_role (account_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账号角色关联';

-- 权限
CREATE TABLE rbac_permission (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(100)    NOT NULL UNIQUE COMMENT '权限编码，如 supply:resource:publish',
    name        VARCHAR(100)    NOT NULL COMMENT '权限名称',
    type        TINYINT         NOT NULL DEFAULT 1 COMMENT '1菜单 2按钮 3数据',
    parent_id   BIGINT UNSIGNED DEFAULT NULL,
    sort_order  INT             NOT NULL DEFAULT 0,
    is_deleted  TINYINT(1)      NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限项';

-- 角色-权限关联
CREATE TABLE rbac_role_permission (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id       BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_perm (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联';

-- 登录日志
CREATE TABLE member_login_log (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_id  BIGINT UNSIGNED NOT NULL,
    login_time  DATETIME        NOT NULL,
    ip          VARCHAR(50)     COMMENT '登录IP',
    terminal    VARCHAR(50)     COMMENT '终端类型 PC/H5/WECHAT/MINIAPP',
    result      TINYINT         NOT NULL DEFAULT 1 COMMENT '1成功 0失败',
    fail_reason VARCHAR(200)    COMMENT '失败原因',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_account_id (account_id),
    INDEX idx_login_time (login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录日志';
```

#### Schema: `gl_supply`

```sql
-- 资源发布
CREATE TABLE supply_resource (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    member_id       BIGINT UNSIGNED NOT NULL COMMENT '发布会员单位ID',
    account_id      BIGINT UNSIGNED NOT NULL COMMENT '发布账号ID',
    type            VARCHAR(50)     NOT NULL COMMENT '资源类型 PRODUCT/TECHNOLOGY/TALENT/CARBON（预留）/GREEN_CERT（预留）',
    title           VARCHAR(300)    NOT NULL COMMENT '标题',
    content         LONGTEXT        COMMENT '详细描述（富文本）',
    summary         VARCHAR(500)    COMMENT '摘要',
    province        VARCHAR(50)     COMMENT '所在省份',
    city            VARCHAR(50)     COMMENT '所在城市',
    cooperation_mode VARCHAR(200)   COMMENT '合作方式',
    valid_until     DATE            COMMENT '有效期',
    view_count      INT             NOT NULL DEFAULT 0 COMMENT '浏览量',
    contact_visible TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '联系方式是否对会员可见',
    audit_status    TINYINT         NOT NULL DEFAULT 0 COMMENT '0待审核 1通过 2拒绝 3已下架',
    audit_remark    VARCHAR(500)    COMMENT '审核备注',
    auditor_id      BIGINT UNSIGNED COMMENT '审核人账号ID',
    audited_at      DATETIME        COMMENT '审核时间',
    -- 二期预留字段
    carbon_amount   DECIMAL(15,4)   DEFAULT NULL COMMENT '碳减排量（预留二期）',
    cert_type       VARCHAR(100)    DEFAULT NULL COMMENT '认证类型（预留二期）',
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_member_id (member_id),
    INDEX idx_type (type),
    INDEX idx_audit_status (audit_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源发布';

-- 需求发布
CREATE TABLE supply_demand (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    member_id       BIGINT UNSIGNED NOT NULL COMMENT '发布会员单位ID',
    account_id      BIGINT UNSIGNED NOT NULL COMMENT '发布账号ID',
    type            VARCHAR(50)     NOT NULL COMMENT '需求类型 PRODUCT/TECHNOLOGY/TALENT/CARBON（预留）',
    title           VARCHAR(300)    NOT NULL COMMENT '标题',
    content         LONGTEXT        COMMENT '详细描述（富文本）',
    summary         VARCHAR(500)    COMMENT '摘要',
    province        VARCHAR(50)     COMMENT '期望省份',
    budget_min      DECIMAL(15,2)   COMMENT '预算下限（万元）',
    budget_max      DECIMAL(15,2)   COMMENT '预算上限（万元）',
    deadline        DATE            COMMENT '截止日期',
    cooperation_mode VARCHAR(200)   COMMENT '期望合作方式',
    view_count      INT             NOT NULL DEFAULT 0,
    audit_status    TINYINT         NOT NULL DEFAULT 0 COMMENT '0待审核 1通过 2拒绝 3已关闭',
    audit_remark    VARCHAR(500)    COMMENT '审核备注',
    auditor_id      BIGINT UNSIGNED COMMENT '审核人账号ID',
    audited_at      DATETIME        COMMENT '审核时间',
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_member_id (member_id),
    INDEX idx_type (type),
    INDEX idx_audit_status (audit_status),
    INDEX idx_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='需求发布';

-- 资源/需求附件
CREATE TABLE supply_attachment (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    biz_type    VARCHAR(20)     NOT NULL COMMENT 'RESOURCE / DEMAND',
    biz_id      BIGINT UNSIGNED NOT NULL COMMENT '关联业务ID',
    file_name   VARCHAR(300)    NOT NULL COMMENT '原始文件名',
    file_url    VARCHAR(500)    NOT NULL COMMENT '存储URL',
    file_size   BIGINT          COMMENT '文件大小（字节）',
    file_type   VARCHAR(50)     COMMENT 'image/pdf/word 等',
    sort_order  INT             NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_biz (biz_type, biz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源需求附件';
```

#### Schema: `gl_match`

```sql
-- 匹配/对接记录
CREATE TABLE match_record (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    resource_id     BIGINT UNSIGNED NOT NULL COMMENT '资源ID（supply_resource）',
    demand_id       BIGINT UNSIGNED NOT NULL COMMENT '需求ID（supply_demand）',
    resource_member_id BIGINT UNSIGNED NOT NULL COMMENT '资源方会员ID',
    demand_member_id   BIGINT UNSIGNED NOT NULL COMMENT '需求方会员ID',
    match_score     DECIMAL(5,2)    COMMENT '匹配度评分（0-100）',
    match_type      TINYINT         NOT NULL DEFAULT 1 COMMENT '1系统推荐 2主动申请',
    status          TINYINT         NOT NULL DEFAULT 1 COMMENT '1待响应 2已接受 3洽谈中 4已签约（预留）5已完成 6已拒绝 7已撤销',
    initiator_id    BIGINT UNSIGNED NOT NULL COMMENT '发起方账号ID',
    apply_message   VARCHAR(1000)   COMMENT '申请留言',
    -- 二期预留字段
    contract_id     BIGINT UNSIGNED DEFAULT NULL COMMENT '合同ID（预留二期）',
    evaluation_done TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '是否已互评（预留二期）',
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_resource_id (resource_id),
    INDEX idx_demand_id (demand_id),
    INDEX idx_resource_member (resource_member_id),
    INDEX idx_demand_member (demand_member_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='匹配对接记录';

-- 对接沟通消息
CREATE TABLE match_message (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    match_id    BIGINT UNSIGNED NOT NULL COMMENT '关联对接记录',
    sender_id   BIGINT UNSIGNED NOT NULL COMMENT '发送方账号ID',
    content     TEXT            NOT NULL COMMENT '消息内容',
    msg_type    TINYINT         NOT NULL DEFAULT 1 COMMENT '1文本 2附件',
    attach_url  VARCHAR(500)    COMMENT '附件URL',
    is_read     TINYINT(1)      NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_match_id (match_id),
    INDEX idx_sender_id (sender_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对接沟通消息';

-- 收藏记录
CREATE TABLE match_favorite (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_id  BIGINT UNSIGNED NOT NULL,
    biz_type    VARCHAR(20)     NOT NULL COMMENT 'RESOURCE / DEMAND',
    biz_id      BIGINT UNSIGNED NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_fav (account_id, biz_type, biz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏记录';
```

#### Schema: `gl_portal`

```sql
-- 门户文章（新闻/通知/政策法规共用）
CREATE TABLE portal_article (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id     BIGINT UNSIGNED NOT NULL COMMENT '栏目ID',
    title           VARCHAR(300)    NOT NULL,
    content         LONGTEXT        COMMENT '正文（富文本）',
    summary         VARCHAR(500)    COMMENT '摘要',
    cover_url       VARCHAR(500)    COMMENT '封面图',
    author          VARCHAR(100)    COMMENT '作者/来源',
    source_url      VARCHAR(500)    COMMENT '原文链接',
    view_count      INT             NOT NULL DEFAULT 0,
    is_top          TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '是否置顶',
    is_published    TINYINT(1)      NOT NULL DEFAULT 0,
    published_at    DATETIME        COMMENT '发布时间',
    publisher_id    BIGINT UNSIGNED COMMENT '发布人账号ID',
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_id (category_id),
    INDEX idx_published_at (published_at),
    INDEX idx_is_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='门户文章';

-- 门户栏目
CREATE TABLE portal_category (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parent_id   BIGINT UNSIGNED DEFAULT NULL,
    name        VARCHAR(100)    NOT NULL COMMENT '栏目名称',
    code        VARCHAR(50)     NOT NULL UNIQUE COMMENT '编码 NEWS/NOTICE/POLICY/ACTIVITY',
    sort_order  INT             NOT NULL DEFAULT 0,
    is_visible  TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='门户栏目';

-- 活动
CREATE TABLE portal_activity (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(300)    NOT NULL,
    content         LONGTEXT        COMMENT '活动详情',
    cover_url       VARCHAR(500)    COMMENT '封面图',
    location        VARCHAR(300)    COMMENT '活动地点',
    start_time      DATETIME        COMMENT '开始时间',
    end_time        DATETIME        COMMENT '结束时间',
    reg_deadline    DATETIME        COMMENT '报名截止',
    max_capacity    INT             COMMENT '最大容量（NULL=不限）',
    reg_count       INT             NOT NULL DEFAULT 0 COMMENT '已报名人数',
    status          TINYINT         NOT NULL DEFAULT 1 COMMENT '1筹备中 2报名中 3已结束',
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动';

-- 活动报名
CREATE TABLE portal_activity_signup (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    activity_id BIGINT UNSIGNED NOT NULL,
    account_id  BIGINT UNSIGNED NOT NULL,
    member_id   BIGINT UNSIGNED NOT NULL,
    remark      VARCHAR(500)    COMMENT '备注',
    status      TINYINT         NOT NULL DEFAULT 1 COMMENT '1已报名 2已签到 3已取消',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_signup (activity_id, account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动报名';
```

#### Schema: 公共支撑（`gl_tag` / `gl_message` / `gl_file`）

```sql
-- 标签分类
CREATE TABLE tag_category (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    code        VARCHAR(50)     NOT NULL UNIQUE COMMENT 'INDUSTRY/RESOURCE/DEMAND/POLICY/CERT',
    sort_order  INT             NOT NULL DEFAULT 0,
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签分类';

-- 标签
CREATE TABLE tag (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    alias       VARCHAR(200)    COMMENT '同义词，逗号分隔（辅助搜索）',
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order  INT             NOT NULL DEFAULT 0,
    is_deleted  TINYINT(1)      NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_id (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签';

-- 业务标签关联
CREATE TABLE tag_relation (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    biz_type    VARCHAR(30)     NOT NULL COMMENT 'RESOURCE/DEMAND/MEMBER/ARTICLE',
    biz_id      BIGINT UNSIGNED NOT NULL,
    tag_id      BIGINT UNSIGNED NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tag_rel (biz_type, biz_id, tag_id),
    INDEX idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='业务标签关联';

-- 消息通知
CREATE TABLE message_notification (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_id  BIGINT UNSIGNED NOT NULL COMMENT '接收账号',
    biz_type    VARCHAR(50)     COMMENT '业务类型 MATCH/AUDIT/ACTIVITY/SYSTEM',
    biz_id      BIGINT UNSIGNED COMMENT '关联业务ID',
    title       VARCHAR(200)    NOT NULL,
    content     TEXT            COMMENT '消息内容',
    channel     VARCHAR(20)     NOT NULL DEFAULT 'SITE' COMMENT 'SITE站内 WECHAT微信',
    is_read     TINYINT(1)      NOT NULL DEFAULT 0,
    read_at     DATETIME        COMMENT '阅读时间',
    send_status TINYINT         NOT NULL DEFAULT 0 COMMENT '0待发送 1已发送 2失败',
    send_at     DATETIME        COMMENT '发送时间',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_account_id (account_id),
    INDEX idx_is_read (account_id, is_read),
    INDEX idx_channel (channel, send_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息通知';

-- 文件记录
CREATE TABLE file_record (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uploader_id BIGINT UNSIGNED NOT NULL COMMENT '上传账号ID',
    biz_type    VARCHAR(30)     COMMENT '业务类型',
    biz_id      BIGINT UNSIGNED COMMENT '关联业务ID',
    file_name   VARCHAR(300)    NOT NULL,
    storage_key VARCHAR(500)    NOT NULL COMMENT 'MinIO/OSS 对象Key',
    file_url    VARCHAR(500)    NOT NULL,
    file_size   BIGINT          COMMENT '字节',
    mime_type   VARCHAR(100),
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_biz (biz_type, biz_id),
    INDEX idx_uploader (uploader_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件上传记录';
```

---

## 五、编码规范

### 5.1 后端编码规范

**包结构（每个微服务）：**
```
com.greenlink.<service>/
├── controller/     # REST 接口层，仅做参数校验与调用
├── service/        # 业务逻辑层（接口 + 实现）
├── repository/     # 数据访问层（MyBatis-Plus Mapper）
├── domain/         # 实体类（与数据库表一一对应）
├── dto/            # 数据传输对象（Request/Response）
├── enums/          # 枚举定义
├── config/         # 配置类
├── exception/      # 自定义异常
└── util/           # 工具类
```

**强制规范：**
- Controller 层不允许出现业务逻辑，只做入参校验（`@Valid`）和响应封装。
- Service 层必须写接口，`@Transactional` 注解只加在 Service 实现上。
- 所有 API 响应统一使用 `Result<T>` 包装类，格式：`{code, msg, data, timestamp}`。
- HTTP 状态码统一返回 200，业务错误通过 `code` 字段区分。**例外：Gateway JwtAuthFilter 对 token 缺失/过期/非法返回 HTTP 401**，使前端 axios 拦截器能触发自动刷新 token 流程；业务服务内部不得自行返回 4xx。
- 全局异常通过 `@RestControllerAdvice` 统一处理，不允许在业务方法中直接返回 error 字符串。
- 禁止在代码中硬编码敏感信息（数据库密码、AppSecret 等），统一通过 Nacos 配置中心或环境变量注入。
- 日志使用 SLF4J + Logback，禁止使用 `System.out.println`；入参出参、异常必须打印日志，日志级别按规范使用。
- 分页查询统一使用 MyBatis-Plus 的 `Page<T>`，禁止 `SELECT *` 全量查询。
- **每个微服务必须在 `config/` 包下配置 `MybatisPlusConfig`，注册 `PaginationInnerInterceptor(DbType.MYSQL)`**。MyBatis-Plus 3.5+ 不再自动注册分页插件，缺失时 `selectPage` 的 `total` 始终为 0。
- 分页列表查询统一使用 `QueryWrapper`（字符串列名）+ `selectPage`，禁止用 `@Select` 注解配合 `IPage<T>` 返回值——该组合的 COUNT 子查询由分页插件生成，实测不可靠。
- `LambdaQueryWrapper` 可用于条件过滤，但不能在其上调用 `.select(字段引用…)`；指定查询列时改用 `QueryWrapper.select("col1", "col2", …)`，避免在无 Spring 上下文的单元测试中触发 lambda cache 查找失败。
- 密码存储统一使用 BCrypt，禁止 MD5 / SHA1。

### 5.2 前端编码规范

**强制规范：**
- 所有响应式布局通过 Tailwind 断点前缀实现，禁止使用 `@media` 内联 CSS 覆盖。
- 组件必须为函数组件 + Hooks，禁止 Class 组件。
- 路由级页面必须使用 `React.lazy` + `Suspense` 懒加载。
- API 调用统一通过 `services/` 目录中的 React Query hook 封装，禁止在组件内直接 `fetch` / `axios`。
- 表单使用 `react-hook-form`，禁止手动管理表单 state。
- 全局主题色在 `tailwind.config.js` 中统一定义，禁止在组件中使用 `style={{ color: '#...' }}` 硬编码颜色。
- 主品牌绿色统一使用 `#10b981`（Tailwind `emerald-500`），不得擅自修改。
- TypeScript 严格模式，禁止使用 `any`，API 响应类型必须定义完整。

---

## 六、接口设计规范

### 6.1 URL 规范

```
GET    /api/v1/{resource}          # 列表查询
GET    /api/v1/{resource}/{id}     # 单条查询
POST   /api/v1/{resource}          # 新建
PUT    /api/v1/{resource}/{id}     # 全量更新
PATCH  /api/v1/{resource}/{id}     # 部分更新
DELETE /api/v1/{resource}/{id}     # 删除（软删除）
```

- 服务前缀由 Gateway 路由分发，各服务内部不携带服务名前缀。
- 版本号 `v1` 必须保留，二期接口变更通过 `v2` 隔离。

### 6.2 统一响应格式

```json
{
  "code": 0,
  "msg": "success",
  "data": { ... },
  "timestamp": 1717380000000
}
```

业务错误码规范：

| 范围 | 含义 |
|---|---|
| 0 | 成功 |
| 1000–1999 | 通用错误（参数、权限、系统） |
| 2000–2999 | 会员/认证模块错误 |
| 3000–3999 | 供需/匹配模块错误 |
| 4000–4999 | 门户模块错误 |
| 5000–5999 | 消息/通知模块错误 |

### 6.3 分页参数约定

请求：`?page=1&size=20&sort=created_at,desc`  
响应 data 结构：
```json
{
  "records": [...],
  "total": 100,
  "page": 1,
  "size": 20,
  "pages": 5
}
```

---

## 七、安全规范

- 所有接口必须通过 Gateway 统一鉴权，禁止服务内部暴露未鉴权端口至公网。
- 涉及会员信息的接口，必须校验当前登录用户是否有权访问目标数据（防越权）。
- 手机号、邮箱等敏感字段在列表接口中进行脱敏（`138****8888`），详情接口按权限控制。
- 文件上传接口须限制文件类型（白名单）和大小（单文件 ≤ 20MB），存储前重命名（UUID），禁止原始文件名直接存储为路径。
- SQL 查询必须使用参数化，禁止字符串拼接 SQL；MyBatis-Plus 使用 `@Param` 注解或 Wrapper。
- XSS 防护：富文本内容入库前使用 HtmlSanitizer 过滤，前端展示使用 `DOMPurify`。
- 登录接口加图形验证码（≥5次失败后），并对账号实施锁定（默认锁定30分钟）。

---

## 八、Git 工作流规范

### 8.1 分支策略

```
main          # 生产分支，仅 release/* 合并，打 tag 发版
develop       # 开发集成分支，所有 feature 向此合并
feature/*     # 功能开发分支，命名：feature/<jira-id>-<description>
hotfix/*      # 生产紧急修复分支
release/*     # 发版准备分支
```

### 8.2 Commit Message 规范

格式：`<type>(<scope>): <subject>`

| type | 说明 |
|---|---|
| feat | 新功能 |
| fix | Bug 修复 |
| refactor | 重构 |
| docs | 文档 |
| test | 测试 |
| chore | 构建/依赖 |
| style | 代码格式 |

示例：`feat(supply): 添加资源发布草稿保存功能`

### 8.3 代码 Review 规则

- 所有 PR 至少需要 1 名成员 Review 通过才能合并至 `develop`。
- 合并前必须通过 CI（编译 + 单元测试 + SonarQube 扫描）。
- 禁止直接 push 至 `main` 和 `develop`。

---

## 九、一期功能开发优先级

按以下顺序推进，后序依赖前序完成：

```
P0（第1-2周）
  ├── 数据库建表（全量，含预留字段）
  ├── gl-auth 服务：登录/注册/JWT/OAuth2
  └── gl-member 服务：会员单位 + 账号 CRUD

P1（第3-5周）
  ├── RBAC 权限：角色/权限/关联
  ├── 标签体系：分类/标签/关联 CRUD
  └── gl-portal 服务：栏目/文章/活动 CMS

P2（第6-9周）
  ├── gl-supply 服务：资源/需求发布、审核流程
  ├── gl-match 服务：匹配引擎（标签召回 + ES全文 + 打分排序）
  └── gl-file 服务：MinIO 文件上传/下载

P3（第10-12周）
  ├── gl-message 服务：站内信 + 微信模板消息推送
  ├── gl-admin BFF：管理端数据看板
  └── 前端三端适配联调与性能优化

P4（第13-16周）
  ├── 安全加固与渗透测试
  ├── CI/CD 流水线完善
  └── UAT 验收 + 性能压测
```

---

## 十、禁止事项速查

| # | 禁止行为 |
|---|---|
| 1 | 在 Controller 层编写业务逻辑 |
| 2 | 硬编码密码、AppSecret、数据库连接串 |
| 3 | 物理删除业务数据（必须软删除） |
| 4 | SELECT * 查询 |
| 5 | 使用 MD5/SHA1 存储密码 |
| 6 | 直接引入 Ant Design / MUI 等重量级 UI 库 |
| 7 | 在前端组件内直接调用 axios/fetch，绕过 React Query 封装 |
| 8 | 使用 Class 组件 |
| 9 | 内联 CSS 覆盖 Tailwind 响应式断点 |
| 10 | 服务间直接查询对方数据库 |
| 11 | 未鉴权的敏感接口暴露至公网 |
| 12 | 富文本内容未做 XSS 过滤直接入库/渲染 |
| 13 | 向 `main`/`develop` 分支直接 push 代码 |
| 14 | 跳过 Code Review 强制合并 PR |
| 15 | 一期开发二期功能（碳资产、签约、信用评价等）的完整业务逻辑 |

---

*本文件由架构组维护，更新后同步通知全体开发成员。如有疑问，优先以本文件为准，再升级至架构组讨论。*
