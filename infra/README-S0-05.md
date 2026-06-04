# S0-05 交付文档：数据库建表（全量 DDL，含二期预留字段）

> **任务来源**：`sprint-plan.md` Sprint 0 — Story S0-05  
> **执行环境**：内网机（MySQL 8.0.46，端口 3307）  
> **部署日期**：2026-06-04  
> **负责人**：架构-赵（AI 辅助执行）

---

## 一、环境信息

| 项目 | 值 |
|---|---|
| MySQL 版本 | 8.0.46 |
| 连接地址 | `10.30.10.49:3307` |
| 字符集 | `utf8mb4` / `utf8mb4_unicode_ci` |
| 存储引擎 | `InnoDB` |
| 数据库用户 | `greenlink`（应用连接）/ `root`（管理） |
| DDL 脚本 | `infra/db/V1.0.0__init.sql` |

---

## 二、已完成任务清单

### T0-05-1：执行全量 DDL（5 个 Schema，23 张业务表）

| Schema | 表数量 | 表清单 |
|---|---|---|
| `gl_member` | 7 张业务表 + flyway | `member_unit`, `member_account`, `rbac_role`, `rbac_permission`, `rbac_role_permission`, `rbac_account_role`, `member_login_log` |
| `gl_supply` | 3 张业务表 + flyway | `supply_resource`, `supply_demand`, `supply_attachment` |
| `gl_match` | 3 张业务表 + flyway | `match_record`, `match_message`, `match_favorite` |
| `gl_portal` | 5 张业务表 + flyway | `portal_category`, `portal_article`, `portal_banner`, `portal_activity`, `portal_activity_signup` |
| `gl_common` | 5 张业务表 + flyway | `tag_category`, `tag`, `tag_relation`, `message_notification`, `file_record` |

**合计：23 张业务表 + 5 张 Flyway 历史表 = 28 张表**

### T0-05-2：验证分区表

以下 3 张流水/日志类表已按月 `RANGE` 分区，每张表含 13 个分区（2026 年 1–12 月 + `p_future` 兜底）：

| 表名 | 分区字段 | Schema |
|---|---|---|
| `member_login_log` | `login_time` | `gl_member` |
| `match_message` | `created_at` | `gl_match` |
| `message_notification` | `created_at` | `gl_common` |

### T0-05-3：导入基础数据

| 数据项 | 数量 | 说明 |
|---|---|---|
| 内置角色 | 7 条 | SUPER_ADMIN / CONTENT_ADMIN / AUDITOR / MEMBER / VIP_MEMBER / EXPERT / FINANCE |
| 门户栏目 | 4 条 | NEWS 行业资讯 / NOTICE 协会通知 / POLICY 政策法规 / ACTIVITY 活动专区 |
| 标签分类 | 6 条 | INDUSTRY / RESOURCE / DEMAND / POLICY / CERT / TECH_FIELD |

### T0-05-4：配置 Flyway 版本管理

- ✅ 5 个 Schema 均已创建 `flyway_schema_history` 表
- ✅ 均已插入 V1.0.0 版本记录（`success = 1`）
- ✅ 后续数据库变更可通过 `V1.0.1__xxx.sql`、`V1.1.0__xxx.sql` 等脚本递进管理

---

## 三、二期预留字段清单

以下字段已在一期 DDL 中创建，但业务逻辑暂未使用：

| 表名 | 字段 | 类型 | 二期功能 |
|---|---|---|---|
| `member_unit` | `credit_score` | DECIMAL(5,2) | 信用评价体系 |
| `member_unit` | `is_certified` | TINYINT(1) | 绿色认证标识 |
| `supply_resource` | `carbon_amount` | DECIMAL(15,4) | 碳减排量（碳资产模块） |
| `supply_resource` | `cert_type` | VARCHAR(100) | 绿色认证类型 |
| `match_record` | `contract_id` | BIGINT UNSIGNED | 线上签约存证 |
| `match_record` | `evaluation_done` | TINYINT(1) | 双方互评完成标志 |

---

## 四、快速验证命令

```bash
# 连接数据库
mysql -h10.30.10.49 -P3307 -ugreenlink -pGreenLink@2026

# 查看各库表数量
SELECT table_schema, COUNT(*) 
FROM information_schema.tables 
WHERE table_schema LIKE 'gl_%' 
GROUP BY table_schema;

# 查看分区表
SELECT table_name, partition_name 
FROM information_schema.partitions 
WHERE partition_name IS NOT NULL 
  AND table_schema IN ('gl_member','gl_match','gl_common')
ORDER BY table_name, partition_name;

# 查看基础数据
SELECT code, name FROM gl_member.rbac_role;
SELECT code, name FROM gl_portal.portal_category;
SELECT code, name FROM gl_common.tag_category;
```

---

## 五、Flyway 使用指南

### 5.1 脚本命名规范

```
V{版本号}__{描述}.sql
```

示例：
- `V1.0.1__add_member_unit_tax_code.sql`
- `V1.1.0__portal_add_column_source_type.sql`

### 5.2 Spring Boot 配置

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    baseline-version: 1.0.0
```

> 注意：各微服务连接各自 Schema，Flyway 脚本按 Schema 拆分存放，分别执行。

---

## 六、关键交付文件

| 文件 | 说明 |
|---|---|
| `infra/db/V1.0.0__init.sql` | 全量 DDL + 基础数据 + Flyway 初始化（约 49KB） |
| `infra/README-S0-05.md` | 本交付文档 |

---

## 七、验收标准对照

| 验收项 | 状态 | 验证方式 |
|---|---|---|
| 22 张表全部创建 | ✅ | `information_schema.tables` 统计确认 28 张表（含 flyway） |
| 分区表结构正确 | ✅ | `information_schema.partitions` 确认 3 张表 × 13 个分区 |
| 6 个内置角色导入 | ✅ | `gl_member.rbac_role` 查询确认 7 条 |
| 4 个门户栏目导入 | ✅ | `gl_portal.portal_category` 查询确认 4 条 |
| 6 个标签分类导入 | ✅ | `gl_common.tag_category` 查询确认 6 条 |
| Flyway 版本记录 | ✅ | 5 个 Schema 的 `flyway_schema_history` 均含 V1.0.0 success=1 |
| 二期预留字段已建 | ✅ | `information_schema.columns` 确认 6 个预留字段存在 |

---

## 八、注意事项

1. **主键与分区键**：
   - 3 张分区表的主键均为联合主键 `PRIMARY KEY (id, <partition_column>)`，这是 MySQL RANGE 分区的要求。
   - 应用层 INSERT 时只需提供 `id` 和正常字段，`partition_column` 由数据库自动分配到对应分区。

2. **分区维护脚本建议**：
   - 每月初执行 `REORGANIZE PARTITION p_future` 新增下月分区。
   - 按保留策略 DROP 过期分区（登录日志保留 24 个月，消息通知保留 12 个月，对接消息保留 36 个月）。

3. **软删除约束**：
   - 所有业务表均含 `is_deleted TINYINT(1) DEFAULT 0`。
   - 应用层查询须默认过滤 `is_deleted = 0`，禁止物理删除。

4. **外键策略**：
   - 严格遵循微服务规范，数据库层面**无外键约束**，关联完整性由应用层保证。

---

*本文档由 AI 辅助生成，实际运维操作请根据内网机具体情况复核。*
