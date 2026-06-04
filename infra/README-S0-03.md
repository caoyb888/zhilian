# S0-03 交付文档：MySQL 8 + Redis 7 + Elasticsearch 8 部署

> **任务来源**：`sprint-plan.md` Sprint 0 — Story S0-03  
> **执行环境**：内网机（Ubuntu 22.04）  
> **部署日期**：2026-06-04  
> **负责人**：运维-褚（AI 辅助执行）

---

## 一、环境信息

| 中间件 | 版本 | 宿主机端口 | 容器内端口 | 数据持久化路径 |
|---|---|---|---|---|
| MySQL | 8.0.46 | `3307` | `3306` | `infra/mysql/data` |
| Redis | 7.x (alpine) | `6382` | `6379` | `infra/redis/data` |
| Elasticsearch | 8.14.0 | `9200` / `9300` | `9200` / `9300` | `infra/elasticsearch/data` |

> **说明**：宿主机 `3306` 和 `6379` 已被其他项目占用，故绿产智链中间件映射到 `3307` 和 `6382`。

---

## 二、已完成任务清单

### 1. MySQL 8.0 部署与初始化

- ✅ Docker 容器 `greenlink-mysql-8` 已启动
- ✅ 字符集 `utf8mb4`，排序规则 `utf8mb4_unicode_ci`（与项目规范一致）
- ✅ 已创建项目所需全部 Database：
  - `gl_auth`   — 认证/SSO
  - `gl_member` — 会员与 RBAC
  - `gl_supply` — 供需对接
  - `gl_match`  — 智能匹配
  - `gl_portal` — 门户内容
  - `gl_common` — 公共支撑（标签、消息、文件）
- ✅ 专用账号 `greenlink` 已创建并授权（避免使用 root）
- ✅ `my.cnf` 自定义配置已挂载

### 2. Redis 7 部署

- ✅ Docker 容器 `greenlink-redis-7` 已启动
- ✅ AOF 持久化已开启
- ✅ 密码认证已配置

### 3. Elasticsearch 8.14.0 部署

- ✅ Docker 容器 `greenlink-es-8` 已启动
- ✅ 单节点模式运行，集群状态 `green`
- ✅ 安全功能已关闭（`xpack.security.enabled=false`，便于测试环境联调）
- ✅ **IK 中文分词插件已安装并验证**
  - 安装来源：`release.infinilabs.com`（国内可访问）
  - 验证结果：`ik_smart` 对 "山东省绿色低碳产业生态智慧链接平台" 分词正确

---

## 三、连接信息

### MySQL

```yaml
host: 10.30.10.49
port: 3307
database: gl_member  # 根据微服务切换
credentials:
  root:     root / GreenLink_Root@2026
  app-user: greenlink / GreenLink@2026
character-set: utf8mb4
collation: utf8mb4_unicode_ci
```

连接命令：
```bash
mysql -h10.30.10.49 -P3307 -ugreenlink -pGreenLink@2026
```

### Redis

```yaml
host: 10.30.10.49
port: 6382
password: GreenLink@2026
```

连接命令：
```bash
redis-cli -h 10.30.10.49 -p 6382 -a GreenLink@2026 ping
```

### Elasticsearch

```yaml
host: 10.30.10.49
port: 9200
security: disabled (测试环境)
```

健康检查：
```bash
curl http://10.30.10.49:9200/_cluster/health
```

IK 分词测试：
```bash
curl -X POST "http://10.30.10.49:9200/_analyze" -H 'Content-Type: application/json' -d '{
  "analyzer": "ik_smart",
  "text": "山东省绿色低碳产业"
}'
```

---

## 四、Spring Boot 数据源配置示例

```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:mysql://10.30.10.49:3307/gl_auth?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
    username: greenlink
    password: GreenLink@2026
    driver-class-name: com.mysql.cj.jdbc.Driver
  data:
    redis:
      host: 10.30.10.49
      port: 6382
      password: GreenLink@2026
      database: 0
      timeout: 3000ms
      lettuce:
        pool:
          max-active: 8
          max-idle: 8
          min-idle: 0

elasticsearch:
  uris: http://10.30.10.49:9200
```

---

## 五、关键部署文件

| 文件/目录 | 说明 |
|---|---|
| `infra/mysql/data/` | MySQL 数据持久化 |
| `infra/mysql/conf/greenlink.cnf` | MySQL 自定义配置 |
| `infra/redis/data/` | Redis AOF 持久化数据 |
| `infra/elasticsearch/data/` | ES 索引与集群数据 |
| `infra/README-S0-03.md` | 本交付文档 |

---

## 六、验收标准对照

| 验收项 | 状态 | 验证方式 |
|---|---|---|
| MySQL 8 正常启动 | ✅ | `docker ps` + 连接验证版本 8.0.46 |
| 数据库字符集正确 | ✅ | `SHOW VARIABLES LIKE 'character%'` → utf8mb4 |
| 项目 Database 已创建 | ✅ | `information_schema.schemata` 查询确认 6 个库 |
| Redis 7 正常启动 | ✅ | `redis-cli ping` → `PONG` |
| Redis 密码认证生效 | ✅ | 无密码连接被拒绝 |
| Elasticsearch 8 正常启动 | ✅ | `_cluster/health` → `status: green` |
| IK 分词插件安装成功 | ✅ | `elasticsearch-plugin list` → `analysis-ik`；分词 API 验证通过 |

---

## 七、注意事项

1. **端口映射**：
   - MySQL 映射到宿主机 `3307`（原 `3306` 被其他项目占用）
   - Redis 映射到宿主机 `6382`（原 `6379` 被其他项目占用）
   - 各微服务 `application.yml` 中请按实际端口配置

2. **ES 安全**：当前关闭了 `xpack.security`，测试环境可直接访问。生产环境必须开启并配置 TLS + 角色访问控制。

3. **IK 词典扩展**：如业务需要自定义行业词库（如"碳中和"、"绿证"、"tCO₂e"），可将 `.dic` 文件放入 ES 容器的 `config/analysis-ik/custom/` 目录，然后调用 `_ik/reload` API 热加载。

4. **数据备份**：
   - MySQL：`docker exec greenlink-mysql-8 mysqldump -uroot -p... --all-databases > backup.sql`
   - Redis：`docker exec greenlink-redis-7 redis-cli -a ... SAVE` 后复制 `infra/redis/data/dump.rdb`
   - ES：使用 `_snapshot` API 创建仓库并备份索引。

---

*本文档由 AI 辅助生成，实际运维操作请根据内网机具体情况复核。*
