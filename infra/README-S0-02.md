# S0-02 交付文档：Nacos 注册中心与配置管理部署

> **任务来源**：`sprint-plan.md` Sprint 0 — Story S0-02  
> **执行环境**：内网机（Ubuntu 22.04）  
> **部署日期**：2026-06-04  
> **负责人**：架构-赵（AI 辅助执行）

---

## 一、环境信息

| 项目 | 值 |
|---|---|
| 部署方式 | Docker Standalone（host 网络模式） |
| 镜像 | `nacos/nacos-server:v2.4.3`（DaoCloud 代理拉取） |
| 运行模式 | standalone + embedded Derby |
| 控制台地址 | http://10.30.10.49:8848/nacos/index.html |
| 服务端口 | `8848`（HTTP API / 控制台） |
| gRPC 端口 | `9848`（客户端长连接，Nacos 2.x 必需） |
| gRPC 集群 | `9849`（集群通信，单机不启用） |
| JVM 内存 | `-Xms512m -Xmx512m` |
| 数据持久化 | `/home/xintong/zhilian/infra/nacos/data` |
| 日志路径 | `/home/xintong/zhilian/infra/nacos/logs` |

---

## 二、已完成任务清单

### 1. Nacos Server 部署

- ✅ Docker 容器 `nacos-standalone` 已启动并运行
- ✅ standalone 模式 + embedded Derby 数据库
- ✅ host 网络模式，内网可直接通过 `10.30.10.49:8848` 访问
- ✅ JVM 内存限制为 512MB，避免测试环境资源占用过高
- ✅ 数据卷持久化挂载，容器重启不丢失配置

### 2. 多环境命名空间隔离

| 命名空间 ID | 名称 | 说明 |
|---|---|---|
| `greenlink-dev` | greenlink-dev | 绿产智链开发环境 |
| `greenlink-test` | greenlink-test | 绿产智链测试环境 |
| `greenlink-prod` | greenlink-prod | 绿产智链生产环境（一期预留） |
| `public` | public | Nacos 默认公共空间 |

### 3. 健康状态验证

- ✅ `/nacos/v1/ns/operator/metrics` 返回 `{"status":"UP"}`
- ✅ 控制台 Web UI 可正常访问
- ✅ 命名空间管理 API 正常响应

---

## 三、快速使用指南

### 3.1 访问控制台

浏览器打开：http://10.30.10.49:8848/nacos/index.html

默认账号密码（未开启鉴权时可直接访问）：
- 用户名：`nacos`
- 密码：`nacos`

### 3.2 查看命名空间列表

```bash
curl -s http://10.30.10.49:8848/nacos/v1/console/namespaces
```

### 3.3 服务注册示例（curl）

```bash
# 向 dev 环境注册一个服务实例
curl -X POST "http://10.30.10.49:8848/nacos/v1/ns/instance" \
  -d "serviceName=gl-auth" \
  -d "groupName=DEFAULT_GROUP" \
  -d "ip=10.30.10.49" \
  -d "port=8080" \
  -d "namespaceId=greenlink-dev" \
  -d "healthy=true"
```

### 3.4 配置发布示例（curl）

```bash
# 向 dev 环境发布一条配置
curl -X POST "http://10.30.10.49:8848/nacos/v1/cs/configs" \
  -d "dataId=gl-auth-application.yml" \
  -d "group=DEFAULT_GROUP" \
  -d "namespaceId=greenlink-dev" \
  -d "content=spring:\n  datasource:\n    url: jdbc:mysql://localhost:3306/gl_auth"
```

---

## 四、Spring Cloud 微服务接入配置

各微服务 `bootstrap.yml`（或 `application.yml`）参考配置：

```yaml
spring:
  application:
    name: gl-auth
  cloud:
    nacos:
      # 注册中心
      discovery:
        server-addr: 10.30.10.49:8848
        namespace: greenlink-dev   # 根据环境切换 dev/test/prod
        group: DEFAULT_GROUP
      # 配置中心
      config:
        server-addr: 10.30.10.49:8848
        namespace: greenlink-dev
        group: DEFAULT_GROUP
        file-extension: yml
        refresh-enabled: true
```

> **注意**：Nacos 2.x 客户端通过 gRPC（端口 9848）与 Server 建立长连接。请确保微服务所在容器/主机可以访问 `10.30.10.49:9848`，否则服务注册会失败。

---

## 五、关键部署文件

| 文件 | 说明 |
|---|---|
| `infra/nacos/data/` | Nacos Derby 数据持久化目录 |
| `infra/nacos/logs/` | Nacos 运行日志 |
| `infra/README-S0-02.md` | 本交付文档 |

---

## 六、验收标准对照

| 验收项 | 状态 | 验证方式 |
|---|---|---|
| Nacos Server 正常启动 | ✅ | `docker ps` 显示 `nacos-standalone` Up；metrics API 返回 `UP` |
| 控制台可访问 | ✅ | 浏览器访问 `http://10.30.10.49:8848/nacos/index.html` |
| 多环境命名空间已创建 | ✅ | API 返回 `greenlink-dev/test/prod` 三个命名空间 |
| 微服务可接入 | ✅ | 提供 Spring Cloud 接入示例配置；gRPC 端口 9848 监听正常 |

---

## 七、后续建议

1. **鉴权开启（测试环境可选）**：当前未开启 Nacos 鉴权（便于开发联调）。如需要，可通过修改 `application.properties` 开启 `nacos.core.auth.enabled=true` 并设置 `nacos.core.auth.server.identity.key/value`。

2. **外置 MySQL 存储**：当前使用 embedded Derby，适合测试环境。生产环境建议切换为外置 MySQL，通过环境变量 `SPRING_DATASOURCE_PLATFORM=mysql` 并挂载数据库配置。

3. **集群部署**：当前为单机 standalone。生产环境建议部署 Nacos 集群（3 节点 + MySQL + Nginx 负载均衡）。

4. **配置备份**：定期备份 `/home/xintong/zhilian/infra/nacos/data` 目录。

---

*本文档由 AI 辅助生成，实际运维操作请根据内网机具体情况复核。*
