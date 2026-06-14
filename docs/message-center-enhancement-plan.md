# 消息中心增强计划

> 目标：在现有对接事件消息基础上，新增三种业务场景的站内信通知
> 预计工作量：11 SP（约 5.5 个工作日）

---

## 背景

当前系统仅有一个消息生成入口：供需对接状态变更（`gl-match → RocketMQ → gl-message`）。
本计划新增以下三种场景：

| 场景 | 通知范围 |
|------|---------|
| 新建/发布活动 | 所有在册会员主账号 |
| 文章审核通过 | 文章作者（publisher_id 对应账号） |
| 资源/需求审核通过 | 发布者 + 所有在册会员主账号 |

---

## 一、MQ Topic 规划

| Topic | Producer 服务 | Consumer Group | 场景 |
|-------|-------------|---------------|------|
| `gl-activity-event` | gl-portal | `gl-message-activity-consumer` | 活动新建/发布 → 广播全员 |
| `gl-article-audit-event` | gl-portal | `gl-message-article-audit-consumer` | 文章审核通过 → 定向作者 |
| `gl-supply-audit-event` | gl-supply | `gl-message-supply-audit-consumer` | 供需审核通过 → 定向发布者 + 广播全员 |

运维预建 Topic（RocketMQ NameServer：`10.30.10.49:9876`）：

```bash
sh mqadmin createTopic -n 10.30.10.49:9876 -c DefaultCluster -t gl-activity-event
sh mqadmin createTopic -n 10.30.10.49:9876 -c DefaultCluster -t gl-article-audit-event
sh mqadmin createTopic -n 10.30.10.49:9876 -c DefaultCluster -t gl-supply-audit-event
```

---

## 二、新增消息体（gl-common）

位置：`gl-common/src/main/java/com/greenlink/common/mq/`

### 2.1 ActivityEventMessage

```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ActivityEventMessage {

    public static final String TOPIC = "gl-activity-event";

    public enum EventType {
        ACTIVITY_CREATED,   // 活动新建（status=1 筹备中）
        ACTIVITY_PUBLISHED  // 活动变为报名中（status=2）
    }

    private String eventType;    // EventType.name()
    private Long   activityId;
    private String activityTitle;
}
```

> `portal_activity` 表无 `publisher_id` 字段，活动通知天然广播，消息体无需携带发布者信息。

### 2.2 ArticleAuditEventMessage

```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ArticleAuditEventMessage {

    public static final String TOPIC = "gl-article-audit-event";

    private Long   articleId;
    private String articleTitle;
    private Long   publisherAccountId;  // portal_article.publisher_id，直接携带避免 Consumer 再查库
}
```

### 2.3 SupplyAuditEventMessage

```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SupplyAuditEventMessage {

    public static final String TOPIC = "gl-supply-audit-event";

    public enum BizType { RESOURCE, DEMAND }

    private String bizType;             // BizType.name()
    private Long   bizId;
    private String bizTitle;
    private Long   publisherAccountId;  // supply_resource/demand.account_id，直接携带
}
```

---

## 三、各服务改动清单

### 3.1 gl-common

| 操作 | 文件 |
|------|------|
| 新增 | `mq/ActivityEventMessage.java` |
| 新增 | `mq/ArticleAuditEventMessage.java` |
| 新增 | `mq/SupplyAuditEventMessage.java` |

### 3.2 gl-portal

| 操作 | 文件 | 说明 |
|------|------|------|
| 新增 | `mq/ActivityEventProducer.java` | `sendCreated()` / `sendPublished()`，`@Autowired(required=false)` 降级 |
| 新增 | `mq/ArticleAuditEventProducer.java` | `sendApproved(articleId, title, publisherAccountId)` |
| 修改 | `service/impl/PortalActivityServiceImpl.java` | `create()` 末尾调 `sendCreated()`；`updateStatus(status==2)` 时调 `sendPublished()` |
| 修改 | `service/impl/PortalArticleServiceImpl.java` | `publish()` 末尾调 `sendApproved()`；`create(PublishMode.NOW)` 分支同步触发 |

**`ActivityEventProducer` 关键方法：**

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class ActivityEventProducer {
    private final RocketMQTemplate rocketMQTemplate;

    public void sendCreated(Long activityId, String title) {
        send(ActivityEventMessage.EventType.ACTIVITY_CREATED, activityId, title);
    }

    public void sendPublished(Long activityId, String title) {
        send(ActivityEventMessage.EventType.ACTIVITY_PUBLISHED, activityId, title);
    }

    private void send(ActivityEventMessage.EventType type, Long activityId, String title) {
        try {
            rocketMQTemplate.convertAndSend(ActivityEventMessage.TOPIC,
                ActivityEventMessage.builder()
                    .eventType(type.name())
                    .activityId(activityId)
                    .activityTitle(title)
                    .build());
        } catch (Exception e) {
            log.warn("活动事件发送失败 eventType={} activityId={}", type, activityId, e);
        }
    }
}
```

**`PortalActivityServiceImpl` 埋点示例：**

```java
// create() 末尾
if (activityEventProducer != null) {
    activityEventProducer.sendCreated(activity.getId(), activity.getTitle());
}

// updateStatus() 中
if (status == 2 && activityEventProducer != null) {
    activityEventProducer.sendPublished(activity.getId(), activity.getTitle());
}
```

**`PortalArticleServiceImpl` 埋点示例：**

```java
// publish() 末尾
if (articleAuditEventProducer != null) {
    articleAuditEventProducer.sendApproved(id, article.getTitle(), article.getPublisherId());
}

// create(PublishMode.NOW) 落库后追加
if (request.getPublishMode() == PublishMode.NOW && articleAuditEventProducer != null) {
    articleAuditEventProducer.sendApproved(article.getId(), article.getTitle(), publisherId);
}
```

### 3.3 gl-supply

| 操作 | 文件 | 说明 |
|------|------|------|
| 新增 | `mq/SupplyAuditEventProducer.java` | `sendApproved(bizType, bizId, title, publisherAccountId)` |
| 修改 | `service/impl/SupplyResourceServiceImpl.java` | `approve()` 末尾调 `sendApproved(RESOURCE, ...)` |
| 修改 | `service/impl/SupplyDemandServiceImpl.java` | `approve()` 末尾调 `sendApproved(DEMAND, ...)` |

**埋点示例：**

```java
// SupplyResourceServiceImpl.approve() 末尾
if (supplyAuditEventProducer != null) {
    supplyAuditEventProducer.sendApproved(
        SupplyAuditEventMessage.BizType.RESOURCE,
        id, resource.getTitle(), resource.getAccountId());
}

// SupplyDemandServiceImpl.approve() 末尾
if (supplyAuditEventProducer != null) {
    supplyAuditEventProducer.sendApproved(
        SupplyAuditEventMessage.BizType.DEMAND,
        id, demand.getTitle(), demand.getAccountId());
}
```

### 3.4 gl-member

| 操作 | 文件 | 说明 |
|------|------|------|
| 修改 | `repository/MemberAccountMapper.java` | 新增 `findAllActiveMainAccountIds()` |
| 修改 | `service/impl/MemberServiceImpl.java` | 实现 `getAllActiveMainAccountIds()` |
| 修改 | `controller/MemberController.java` | 新增内部接口 `GET /api/v1/members/internal/all-active-main-account-ids`（无鉴权） |

**Mapper：**

```java
@Select("SELECT id FROM member_account " +
        "WHERE parent_id IS NULL AND status = 1 AND is_deleted = 0 " +
        "ORDER BY id ASC")
List<Long> findAllActiveMainAccountIds();
```

**Controller：**

```java
@GetMapping("/internal/all-active-main-account-ids")
public Result<List<Long>> getAllActiveMainAccountIds() {
    return Result.ok(memberService.getAllActiveMainAccountIds());
}
```

### 3.5 gl-message

| 操作 | 文件 | 说明 |
|------|------|------|
| 新增 | `mq/ActivityEventConsumer.java` | 消费 `gl-activity-event`，调 `createFromActivityEvent()` |
| 新增 | `mq/ArticleAuditEventConsumer.java` | 消费 `gl-article-audit-event`，调 `createFromArticleAuditEvent()` |
| 新增 | `mq/SupplyAuditEventConsumer.java` | 消费 `gl-supply-audit-event`，调 `createFromSupplyAuditEvent()` |
| 新增 | `service/NotificationBatchWriter.java` | 封装 `@Transactional(REQUIRES_NEW)` 分批写入，解决自调用事务失效 |
| 修改 | `feign/MemberInternalClient.java` | 新增 `getAllActiveMainAccountIds()` Feign 方法 |
| 修改 | `repository/MessageNotificationMapper.java` | 新增 MyBatis foreach `batchInsert()` |
| 修改 | `service/SiteNotificationService.java` | 接口新增 3 个方法签名 |
| 修改 | `service/impl/SiteNotificationServiceImpl.java` | 实现 3 个新方法 + 广播分批逻辑 |

**Consumer 模板（三个 Consumer 结构相同）：**

```java
@Slf4j
@Component
@RequiredArgsConstructor
@RocketMQMessageListener(
        topic = ActivityEventMessage.TOPIC,
        consumerGroup = "gl-message-activity-consumer"
)
public class ActivityEventConsumer implements RocketMQListener<ActivityEventMessage> {

    private final SiteNotificationService siteNotificationService;

    @Override
    public void onMessage(ActivityEventMessage event) {
        log.info("收到活动事件 eventType={} activityId={}",
                event.getEventType(), event.getActivityId());
        try {
            siteNotificationService.createFromActivityEvent(event);
        } catch (Exception e) {
            log.error("处理活动事件失败 activityId={}", event.getActivityId(), e);
            throw e; // 抛出触发 RocketMQ 内置重试
        }
    }
}
```

**MessageNotificationMapper 批量插入：**

```java
@Insert("<script>" +
        "INSERT INTO message_notification " +
        "(account_id, biz_type, biz_id, title, content, channel, is_read, send_status, send_at, created_at) " +
        "VALUES " +
        "<foreach collection='list' item='n' separator=','>" +
        "(#{n.accountId},#{n.bizType},#{n.bizId},#{n.title},#{n.content}," +
        " #{n.channel},#{n.isRead},#{n.sendStatus},#{n.sendAt},#{n.createdAt})" +
        "</foreach>" +
        "</script>")
void batchInsert(@Param("list") List<MessageNotification> list);
```

**MemberInternalClient 扩展：**

```java
@FeignClient(name = "gl-member", url = "${gl.member.url:http://localhost:18082}")
public interface MemberInternalClient {

    @PostMapping("/api/v1/members/internal/main-account-ids")
    Result<Map<Long, Long>> getMainAccountIds(@RequestBody List<Long> memberIds);

    // 新增
    @GetMapping("/api/v1/members/internal/all-active-main-account-ids")
    Result<List<Long>> getAllActiveMainAccountIds();
}
```

---

## 四、广播分批写入设计

广播场景（活动发布、供需审核通过）需向全量会员写消息，采用分批独立事务策略：

```
fetchAllActiveMainAccountIds()   ← Feign → gl-member
        ↓
  按 BATCH_SIZE=200 分批
        ↓ 每批
NotificationBatchWriter.batchInsert()   ← @Transactional(REQUIRES_NEW)
        ↓
MessageNotificationMapper.batchInsert() ← MyBatis foreach INSERT
```

**`NotificationBatchWriter`（独立 Service，解决 Spring 自调用事务失效）：**

```java
@Service
@RequiredArgsConstructor
public class NotificationBatchWriter {

    private static final int BATCH_SIZE = 200;
    private final MessageNotificationMapper notificationMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void batchInsert(List<MessageNotification> notifications) {
        if (!notifications.isEmpty()) {
            notificationMapper.batchInsert(notifications);
        }
    }
}
```

**`SiteNotificationServiceImpl` 广播逻辑：**

```java
// 活动广播
@Override
public void createFromActivityEvent(ActivityEventMessage event) {
    broadcastToAllMembers("ACTIVITY", event.getActivityId(),
        "【新活动上线】",
        "平台发布了新活动：" + event.getActivityTitle() + "，欢迎报名参加！");
}

// 文章审核通过（定向）
@Override
public void createFromArticleAuditEvent(ArticleAuditEventMessage event) {
    if (event.getPublisherAccountId() == null) return;
    notificationMapper.insert(buildNotification(
        event.getPublisherAccountId(), "AUDIT", event.getArticleId(),
        "【文章审核通过】",
        "您发布的文章《" + event.getArticleTitle() + "》已审核通过并发布。"));
}

// 供需审核通过（定向 + 广播）
@Override
public void createFromSupplyAuditEvent(SupplyAuditEventMessage event) {
    String bizLabel = "RESOURCE".equals(event.getBizType()) ? "资源" : "需求";

    // 定向通知发布者
    if (event.getPublisherAccountId() != null) {
        notificationMapper.insert(buildNotification(
            event.getPublisherAccountId(), "AUDIT", event.getBizId(),
            "【" + bizLabel + "审核通过】",
            "您发布的" + bizLabel + "《" + event.getBizTitle() + "》已审核通过，现已对外公开。"));
    }

    // 广播全员
    broadcastToAllMembers("AUDIT", event.getBizId(),
        "【新" + bizLabel + "发布】",
        "平台新增" + bizLabel + "：《" + event.getBizTitle() + "》，欢迎查看洽谈！");
}

// 广播核心方法
private void broadcastToAllMembers(String bizType, Long bizId, String title, String content) {
    List<Long> allAccountIds = fetchAllActiveMainAccountIds();
    if (allAccountIds.isEmpty()) {
        log.warn("广播失败：未获取到有效会员账号 bizType={} bizId={}", bizType, bizId);
        return;
    }
    LocalDateTime now = LocalDateTime.now();
    int total = 0;
    for (int offset = 0; offset < allAccountIds.size(); offset += BATCH_SIZE) {
        List<Long> batch = allAccountIds.subList(
            offset, Math.min(offset + BATCH_SIZE, allAccountIds.size()));
        List<MessageNotification> notifications = batch.stream()
            .map(accountId -> buildNotification(accountId, bizType, bizId, title, content, now))
            .collect(Collectors.toList());
        notificationBatchWriter.batchInsert(notifications);
        total += notifications.size();
    }
    log.info("广播写入完成 bizType={} bizId={} total={}", bizType, bizId, total);
}
```

**`SiteNotificationService` 接口新增方法签名：**

```java
void createFromActivityEvent(ActivityEventMessage event);
void createFromArticleAuditEvent(ArticleAuditEventMessage event);
void createFromSupplyAuditEvent(SupplyAuditEventMessage event);
```

---

## 五、数据库变更

**无 DDL 变更。**

`message_notification` 表已有 `ACTIVITY` 和 `AUDIT` 的 `biz_type` 枚举值，无需修改表结构。

---

## 六、Story 拆分与工作量

| Story | 描述 | 涉及服务 | SP |
|-------|------|---------|-----|
| S-MSG-01 | gl-common：新增 3 个消息体类 | gl-common | 1 |
| S-MSG-02 | gl-member：广播查询接口（Mapper/Service/Controller） | gl-member | 1 |
| S-MSG-03 | gl-portal：活动事件 Producer + Service 埋点 | gl-portal | 1 |
| S-MSG-04 | gl-portal：文章审核事件 Producer + Service 埋点 | gl-portal | 1 |
| S-MSG-05 | gl-supply：供需审核事件 Producer + Service 埋点 | gl-supply | 1 |
| S-MSG-06 | gl-message：Mapper batchInsert + Feign 扩展 | gl-message | 1 |
| S-MSG-07 | gl-message：NotificationBatchWriter + Service 接口/实现扩展 | gl-message | 2 |
| S-MSG-08 | gl-message：3 个 Consumer 类 | gl-message | 1 |
| S-MSG-09 | 单测：广播分批边界（0/199/200/201/401 条） | gl-message | 1 |
| S-MSG-10 | 单测：Producer 埋点 + Member 查询接口 | gl-portal/supply/member | 1 |
| S-MSG-11 | 集成验证：Topic 创建 + 端到端投递确认 | 运维+开发 | 1 |

**总计：11 SP（约 5.5 个工作日）**

---

## 七、关键设计决策

### 广播事务策略

使用 `REQUIRES_NEW` 独立小事务分批写入（200 条/批），理由：
- 避免广播大事务超时导致主业务回滚
- 单批约 50ms，Consumer 无感知阻塞
- 最终一致性：某批失败时已成功批次不回滚，Consumer 抛出异常由 RocketMQ 重试整条消息

如需强一致性可改用 `REQUIRED` 合并事务，但存在大事务风险，当前规模不推荐。

### Producer 降级处理

所有新 Producer 均以 `@Autowired(required = false)` 注入，发送失败只打 WARN 日志不抛出异常，保证主业务（活动创建、文章发布、审核操作）不因消息发送失败而回滚。

### Consumer 异常重试

Consumer 捕获异常后重新抛出，由 RocketMQ 内置重试机制（默认 16 次，间隔递增）保证消息不丢。广播场景如需幂等保护，可在 `batchInsert` 前对 `(account_id, biz_type, biz_id)` 做去重检查（后续优化项）。

### 文章「立即发布」双入口

`PortalArticleServiceImpl.create(PublishMode.NOW)` 和 `publish()` 两处都会将 `is_published` 设为 1，均需触发审核通知，实现时两处都要埋点。定时发布（`ScheduledPublishJob`）暂不纳入本计划范围。
