# S0-04 交付文档：MinIO 文件存储 + RocketMQ 消息队列部署

> **任务来源**：`sprint-plan.md` Sprint 0 — Story S0-04  
> **执行环境**：内网机（Ubuntu 22.04）  
> **部署日期**：2026-06-04  
> **负责人**：运维-褚（AI 辅助执行）

---

## 一、环境信息

| 中间件 | 版本 | 宿主机端口 | 说明 |
|---|---|---|---|
| **MinIO** | RELEASE.2024-11-07 | `9020` (S3 API) / `9021` (Console) | 文件存储服务 |
| **RocketMQ NameServer** | 5.3.0 | `9876` | 名称服务 |
| **RocketMQ Broker** | 5.3.0 | `10911` (Remoting) / `10909` (VIP) / `10912` (HA) | 消息 Broker |

> **说明**：宿主机 `9000/9001` 已被其他项目 MinIO 占用，绿产智链 MinIO 映射到 `9020/9021`。

---

## 二、已完成任务清单

### 1. MinIO 部署

- ✅ Docker 容器 `greenlink-minio` 已启动
- ✅ S3 API 端口 `9020`，Web Console 端口 `9021`
- ✅ 初始 Bucket `greenlink-files` 已创建
- ✅ Root 账号：`greenlink` / `GreenLink_MinIO@2026`
- ✅ 数据持久化至 `infra/minio/data`

### 2. RocketMQ 部署

- ✅ NameServer 容器 `greenlink-rocketmq-nameserver` 已启动（host 网络）
- ✅ Broker 容器 `greenlink-rocketmq-broker` 已启动（host 网络）
- ✅ Broker 已成功注册到 NameServer（`broker-a, 10.30.10.49:10911`）
- ✅ 集群状态 `ACTIVATED`，版本 `V5_3_0`
- ✅ 测试 Topic `greenlink-test-topic` 创建成功

---

## 三、连接信息

### MinIO

```yaml
endpoint: http://10.30.10.49:9020
console:  http://10.30.10.49:9021
region:   us-east-1
bucket:   greenlink-files
credentials:
  access-key: greenlink
  secret-key: GreenLink_MinIO@2026
```

连接命令（mc）：
```bash
mc alias set greenlink http://10.30.10.49:9020 greenlink GreenLink_MinIO@2026
mc ls greenlink/
mc cp myfile.pdf greenlink/greenlink-files/
```

### RocketMQ

```yaml
namesrvAddr: 10.30.10.49:9876
broker:      10.30.10.49:10911
cluster:     DefaultCluster
brokerName:  broker-a
```

集群状态查看：
```bash
docker run --rm --network host \
  docker.m.daocloud.io/apache/rocketmq:5.3.0 \
  sh mqadmin clusterList -n 10.30.10.49:9876
```

Topic 管理：
```bash
# 创建 Topic
docker run --rm --network host \
  docker.m.daocloud.io/apache/rocketmq:5.3.0 \
  sh mqadmin updateTopic -n 10.30.10.49:9876 -t <topic-name> -c DefaultCluster

# 查看 Topic 列表
docker run --rm --network host \
  docker.m.daocloud.io/apache/rocketmq:5.3.0 \
  sh mqadmin topicList -n 10.30.10.49:9876
```

---

## 四、Spring Boot 接入配置示例

### MinIO（gl-file 服务）

```yaml
minio:
  endpoint: http://10.30.10.49:9020
  access-key: greenlink
  secret-key: GreenLink_MinIO@2026
  bucket-name: greenlink-files
```

Maven 依赖：
```xml
<dependency>
    <groupId>io.minio</groupId>
    <artifactId>minio</artifactId>
    <version>8.5.7</version>
</dependency>
```

### RocketMQ

```yaml
rocketmq:
  name-server: 10.30.10.49:9876
  producer:
    group: gl-message-producer-group
    send-message-timeout: 3000
    retry-times-when-send-failed: 2
  consumer:
    group: gl-message-consumer-group
```

Maven 依赖：
```xml
<dependency>
    <groupId>org.apache.rocketmq</groupId>
    <artifactId>rocketmq-spring-boot-starter</artifactId>
    <version>2.3.0</version>
</dependency>
```

---

## 五、关键部署文件

| 文件/目录 | 说明 |
|---|---|
| `infra/minio/data/` | MinIO 对象存储数据 |
| `infra/rocketmq/broker.conf` | RocketMQ Broker 配置文件 |
| `infra/README-S0-04.md` | 本交付文档 |

---

## 六、验收标准对照

| 验收项 | 状态 | 验证方式 |
|---|---|---|
| MinIO Server 正常启动 | ✅ | API 健康检查 `200`；Console 可访问 |
| MinIO Bucket 已创建 | ✅ | `mc stat local/greenlink-files` 确认存在 |
| RocketMQ NameServer 正常启动 | ✅ | 日志显示 `The Name Server boot success` |
| RocketMQ Broker 正常启动 | ✅ | 日志显示 `The broker[broker-a, ...] boot success` |
| Broker 已注册到 NameServer | ✅ | `mqadmin clusterList` 显示 `ACTIVATED` |
| Topic 可创建 | ✅ | `mqadmin updateTopic` 返回 `create topic ... success` |

---

## 七、注意事项

1. **端口占用**：
   - MinIO 使用 `9020/9021`（原 `9000/9001` 被其他项目占用）
   - 各微服务 `application.yml` 中请按实际端口配置

2. **MinIO 生产建议**：
   - 当前为单节点单机部署，测试环境可用。生产环境应使用 MinIO 分布式模式（至少 4 节点）或直接使用阿里云 OSS。
   - 可通过 `mc mirror` 定期备份 bucket 数据。

3. **RocketMQ 存储**：
   - Broker 的 commitlog 和 consumequeue 默认存储在容器内的 `/home/rocketmq/store/` 下。
   - 如需持久化，建议后续挂载宿主机目录到容器内的 store 路径，避免容器重建丢失消息。

4. **消息堆积监控**：
   - RocketMQ 5.x 内置了简单的监控能力，可通过 `mqadmin topicStatus` 查看各 Topic 的消费进度。
   - 生产环境建议接入 RocketMQ Dashboard 或 Prometheus Exporter。

5. **文件上传限制**：
   - 根据项目规范，单文件上传限制 ≤ 20MB，类型白名单校验需在 `gl-file` 服务中实现，MinIO 本身不限制。

---

*本文档由 AI 辅助生成，实际运维操作请根据内网机具体情况复核。*
