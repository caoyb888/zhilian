# 绿产智链 — 测试意见改进计划

> 文档版本：v1.0　|　创建日期：2026-06-24　|　来源：UAT 测试意见（13 条）
> 适用分支：`develop`（HEAD `78b7089`）　|　维护：架构组

本计划针对一轮测试反馈的 13 条意见，逐项给出**现状定位（含代码位置）→ 问题分析 → 改进方案 → 涉及改动 → 优先级/工作量**，并抽取出一项贯穿多条意见的公共基础改造（**数据字典系统**）。

---

## 一、改进项汇总

| # | 意见摘要 | 模块 | 类型 | 优先级 | 预估 |
|---|---|---|---|---|---|
| 1 | 注册城市改为选择按钮 | 注册 | 前端(+字典) | P1 | 0.5d |
| 2 | 资源类型扩为 5 类 + 字典管理 | 供需/字典 | 前后端+DB | **P0** | 3d |
| 3 | 资源附件支持视频格式 | 供需/文件 | 前后端 | P1 | 1.5d |
| 4 | 资源审核提示删除"1个工作日" | 供需 | 前端文案 | P2 | 0.2d |
| 5 | 资源管理详情页布局整体调整 | 供需 | 前端UI | P1 | 2d |
| 6 | 资源审核增加批量审核 | 管理端 | 前后端 | **P0** | 2d |
| 7 | 审核页"详情"与"审核"分开，详情更全面 | 管理端 | 前端 | P1 | 1.5d |
| 8 | 注册审核文案"工作人员1-3个工作日内审核" | 注册 | 前端文案 | P2 | 0.2d |
| 9 | 注册补"上传资质证书"；会员详情分三区 | 会员 | 前后端 | P1 | 2.5d |
| 10 | "发布供需"应可选发资源/发需求 | 供需 | 前端 | **P0** | 0.5d |
| 11 | 需求类型改下拉列表（可灵活增加） | 供需/字典 | 前后端+DB | **P0** | 含于#2 |
| 12 | 切换用户后清除旧用户访问路径 | 全局 | 前端 | P1 | 0.5d |
| 13 | 需求对接支持 1对N（复选框） | 对接 | 前后端 | P2 | 3d |

> 优先级定义：**P0** = 影响核心流程/数据可维护性，优先排期；P1 = 体验与完整性；P2 = 文案与增强。

---

## 二、公共基础改造：数据字典系统（支撑 #2 / #11，可选支撑 #1）

### 现状
- 资源/需求类型当前在前端硬编码：`green-link-web/src/services/supplyService.ts`
  - `ResourceType = 'PRODUCT' | 'TECHNOLOGY' | 'TALENT'`（仅 3 类）
  - `RESOURCE_TYPE_LABELS` / `DEMAND_TYPE_LABELS` / `RESOURCE_TYPES` / `DEMAND_TYPES` 均为常量
  - `PROVINCES` 为硬编码数组，无 `CITIES`
- 后端 `supply_resource.type` / `supply_demand.type` 为 `VARCHAR(50)`，无字典约束。
- 项目已有标签体系（`gl-tag`：`tag_category` / `tag`），但**类型字段并非标签**，不宜直接复用。

### 方案
新增轻量**数据字典**能力（建议落在 `gl-common`/`gl-tag` 支撑域，schema `gl_common`）：

```sql
-- 字典类型
CREATE TABLE sys_dict_type (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE COMMENT 'RESOURCE_TYPE/DEMAND_TYPE/CITY 等',
    name        VARCHAR(100) NOT NULL,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字典类型';

-- 字典项
CREATE TABLE sys_dict_item (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type_code   VARCHAR(50)  NOT NULL COMMENT '关联 sys_dict_type.code',
    item_value  VARCHAR(50)  NOT NULL COMMENT '值 如 TECH_SERVICE',
    item_label  VARCHAR(100) NOT NULL COMMENT '展示名 如 技术服务',
    parent_value VARCHAR(50) DEFAULT NULL COMMENT '父级值（省-市级联用）',
    sort_order  INT          NOT NULL DEFAULT 0,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type_code),
    INDEX idx_parent (type_code, parent_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字典项';
```

- 后端：`GET /api/v1/dict/{typeCode}` 返回字典项列表（带缓存）；管理端 CRUD `sys_dict_item`。
- 前端：新增 `services/dictService.ts`（React Query），用 `useDict('RESOURCE_TYPE')` 替换硬编码常量；提供 `<DictSelect typeCode=... />` 通用组件。
- 管理端：新增"字典管理"菜单（`green-link-web/src/pages/admin/`），维护字典项。

> **兼容性**：`type` 字段值仍存英文 code（如 `TECH_SERVICE`），前端展示走字典 label，避免历史数据迁移成本。

---

## 三、逐项详细方案

### #1 注册城市改为选择按钮
- **现状**：`green-link-web/src/pages/auth/RegisterPage.tsx:319-344`，省份/城市均为文本输入框（`register('province')` / `register('city')`）。
- **方案**：省份用下拉（复用 `PROVINCES` 或字典 `CITY` 父级），城市按所选省份**级联**为按钮组/下拉（数据走字典 `parent_value`）。先省后市，未选省禁用城市。
- **改动**：前端 `RegisterPage.tsx`；字典 `CITY` 类型数据（可先内置常用城市，逐步字典化）。

### #2 资源类型扩为 5 类 + 字典管理
- **现状**：`supplyService.ts` 仅 3 类；`SupplyPublishPage.tsx:262-296` 按钮组渲染 `RESOURCE_TYPES`。
- **目标 5 类**：技术服务 `TECH_SERVICE`、产品服务 `PRODUCT_SERVICE`、供应能力 `SUPPLY_CAPABILITY`、合作项目 `COOPERATION_PROJECT`、人才资源 `TALENT_RESOURCE`。
- **方案**：依赖**第二节字典系统**，`RESOURCE_TYPE` 字典初始化 5 项；前端发布页、列表筛选、详情、审核页统一改用字典；保留旧值映射（`PRODUCT→PRODUCT_SERVICE` 等）以兼容历史数据。
- **改动**：DB 字典初始化 + 历史值迁移脚本；前端去除 `RESOURCE_TYPE_LABELS` 硬编码改用字典。

### #3 资源附件支持视频格式
- **现状**：`SupplyPublishPage.tsx:555` `accept="image/*,application/pdf,.doc,.docx,...,.zip,.rar"`，无视频；后端 `gl-file` 白名单与大小限制（`max-file-size=20MB`）不支持大视频。
- **方案**：
  1. 前端 accept 增加 `video/mp4,video/quicktime,.mp4,.mov`；预览组件支持视频缩略/播放。
  2. 后端 `gl-file` 文件类型白名单加入视频 MIME；**单文件上限上调**（视频建议 ≥100MB，需评估 MinIO/Nginx `client_max_body_size` 与超时）。
  3. `supply_attachment.file_type` 增加 `video` 取值；详情页按 `file_type` 分区展示（图文/视频/案例）。
- **风险**：视频体积大，需确认存储与带宽；建议分片上传或限制时长/码率（可二期）。

### #4 资源审核提示删除"1个工作日"
- **现状**：`SupplyPublishPage.tsx:679` 与 `:719` 文案含"1 个工作日内完成审核"。
- **方案**：按客户要求去除具体时限，改为"提交后将由协会工作人员审核，结果通过站内信通知您"（最终文案待客户确认）。
- **改动**：纯前端文案，2 处。

### #5 资源管理详情页布局整体调整
- **现状**：`green-link-web/src/pages/supply/SupplyResourceDetailPage.tsx`（含对接 CTA、匹配推荐、附件等），反馈布局偏乱。
- **方案**：信息架构重排——
  - 顶部：标题/类型/状态/发布方 + 核心 CTA（发起对接）
  - 主体左：详情（富文本）、附件分区（图文/视频/案例）
  - 主体右：发布方信息卡、匹配推荐、联系方式（按权限）
  - 统一卡片/间距规范，复用现有 UI 组件库（Headless UI + Tailwind）。
- **改动**：前端 `SupplyResourceDetailPage.tsx` 重构；可先出 UI 草图评审。

### #6 资源审核增加批量审核
- **现状**：`green-link-web/src/pages/admin/SupplyAuditPage.tsx` 仅单条 `AuditModal`，无勾选/批量。
- **方案**：
  1. 列表行增加复选框 + 表头全选；底部批量操作条（批量通过/批量拒绝，拒绝需统一审核意见）。
  2. 后端新增批量审核接口 `PATCH /api/v1/supply/resources/audit/batch`（入参 id 列表 + action + remark），事务处理。
- **改动**：前端审核页；`gl-supply` 审核 Service/Controller。

### #7 审核页"详情"与"审核"分开，详情更全面
- **现状**：`SupplyAuditPage.tsx:339/465` "查看详情/审核"合并在同一 `AuditModal`，详情字段不全。
- **方案**：拆为两步/两区——
  - "查看详情"：只读抽屉，完整展示资源全部字段（含附件、标签、发布方、联系方式、时间线）。
  - "审核"：独立操作区（通过/拒绝 + 意见），可在详情抽屉内置底部审核条。
- **改动**：前端审核页与详情抽屉组件。

### #8 注册审核文案调整
- **现状**：`RegisterPage.tsx:222/260` 已为"协会工作人员将在 1–3 个工作日内完成审核"。
- **方案**：与客户确认目标措辞（如"工作人员将在 1–3 个工作日内审核"），统一两处文案。当前基本符合，属微调。
- **改动**：纯前端文案。

### #9 注册补"上传资质证书"；会员详情分三区
- **现状**：`RegisterPage.tsx` 无资质/证书上传项；会员详情未按分区组织。
- **方案**：
  1. 注册表单增加"资质证书/营业执照"上传（走 `gl-file`，存 `file_record` 并关联会员）。
  2. 会员详情页按三区重组：**会员基本信息**（单位/行业/地区/联系人）、**会员资料信息**（简介/Logo/资质附件）、**会员安全信息**（账号/登录记录/状态）。
- **改动**：前端注册页 + 会员详情页；`gl-member` 增加资质附件关联字段/关系（`member_unit` 已有 `logo_url`，资质建议用 `file_record` 关联或新增字段）。

### #10 "发布供需"应可选发资源/发需求
- **现状**：`green-link-web/src/business/PortalNav.tsx:177-182` "发布供需"按钮硬跳 `/supply/resources/publish`，无法发需求。
- **方案**：点击弹出选择菜单（发布资源 / 发布需求）或落地到一个"发布选择页"，分别跳 `/supply/resources/publish` 与 `/supply/demands/publish`（路由已存在，见 `App.tsx:115/118`）。
- **改动**：前端 `PortalNav.tsx`（小改，**性价比最高**）。

### #11 需求类型改下拉列表（可灵活增加）
- **现状**：`supplyService.ts` `DEMAND_TYPES` 仅 3 类，`SupplyDemandPublishPage.tsx` 渲染固定项。
- **目标类型**：采购需求 `PURCHASE`、技术需求 `TECHNOLOGY`、业务需求 `BUSINESS`、资金需求 `CAPITAL`、人才需求 `TALENT` 等。
- **方案**：并入**第二节字典系统**（`DEMAND_TYPE` 字典），发布页/筛选/详情改用 `<DictSelect typeCode="DEMAND_TYPE" />`，后续可在字典管理中增删。
- **改动**：同 #2，前端去硬编码 + 字典初始化。

### #12 切换用户后清除旧用户访问路径
- **现状**：`green-link-web/src/stores/authStore.ts` 退出/切换登录未强制复位路由与缓存，可能残留上一个用户的页面/数据。
- **方案**：登录成功与退出登录时：
  1. `navigate('/', { replace: true })`（或登录后跳各端默认首页）。
  2. `queryClient.clear()` 清空 React Query 缓存，避免旧用户数据闪现。
  3. 校验 `RequireAuth` 在身份变化时重新求值。
- **改动**：前端 `authStore.ts` + 登录/退出调用处。

### #13 需求对接支持 1对N（复选框）
- **现状**：`SupplyResourceDetailPage.tsx:714-728` 为单资源"发起对接申请"，对接为 1对1；`match_record`（CLAUDE.md）以单 resource_id+demand_id 成对。
- **方案**：在"我的需求/我的资源"对接场景支持多选——
  - 资源方查看某需求时，可勾选自己名下**多个资源**一次性发起对接（1 需求 ↔ N 资源）；反之亦然。
  - 后端批量创建 `match_record`（去重已存在对接），前端用复选框 + 批量提交。
- **改动**：前端 `MyDemandsPage.tsx`/对接入口 + `gl-match` 批量发起接口。
- **复杂度**：涉及匹配数据模型与去重逻辑，建议**最后排期**，可单独评审。

---

## 四、实施优先级与排期建议

**第一批（P0，1 周内）**——核心流程与可维护性：
- #10 发布供需入口（0.5d，立即可做）
- #2 + #11 数据字典系统 + 资源/需求类型扩展（含字典基础设施，约 4d）
- #6 批量审核（2d）

**第二批（P1，第 2–3 周）**——体验与完整性：
- #1 城市选择、#3 视频附件、#5 详情页重构、#7 审核详情拆分、#9 资质上传+会员详情分区、#12 切换用户复位

**第三批（P2，按需）**——文案与增强：
- #4 / #8 文案（随手并入相关迭代）
- #13 对接 1对N（单独评审后排期）

---

## 五、风险与注意事项

1. **字典化迁移**：#2/#11 改类型枚举需提供历史数据值映射脚本（旧 `PRODUCT/TECHNOLOGY/TALENT` → 新值），上线前在测试库验证。
2. **视频上传**（#3）：现 `gl-file` 单文件 20MB 限制不足以承载视频，需联动调整 MinIO、Nginx `client_max_body_size`、网关超时；大文件建议分片或限制时长，必要时降级为二期。
3. **批量接口事务**（#6/#13）：批量操作需保证幂等与部分失败处理（返回逐条结果）。
4. **规范遵循**：所有改动遵守 `CLAUDE.md`——前端禁直接 axios（走 React Query）、禁重量级 UI 库、品牌绿 `#10b981`；后端统一 `Result<T>`、软删除、字典查询走分页插件。
5. **文案待确认**：#4/#8 最终措辞需客户拍板后再落地。
6. **一期范围**：上述均属一期体验完善，不触碰二期功能（碳资产、签约、信用评价）。

---

*本计划为评审初稿，工作量为粗估，最终以拆分后的 Story 排期为准。*
