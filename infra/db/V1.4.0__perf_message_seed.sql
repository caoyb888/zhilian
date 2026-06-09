-- ============================================================
-- S6-11: 消息压测数据准备
-- 目标：为 lvneng_main（account_id=4）插入 1000 条站内信，
--       覆盖 4 种 biz_type、50% 已读/50% 未读，
--       时间戳跨 2026-01 ~ 2026-06 六个分区
-- 同步新增 idx_account_channel_time 索引，优化默认列表查询路径：
--       WHERE account_id=? AND channel='SITE' ORDER BY created_at DESC
-- ============================================================

USE gl_message;

-- ── 补充索引：覆盖消息列表最常用的查询模式 ──────────────────────────
-- 原有 idx_account_unread(account_id, is_read, created_at) 对不带 is_read
-- 过滤的通用列表查询，channel 须在索引外额外过滤。
-- 新索引将 channel 前置，ORDER BY created_at DESC 可直接由索引满足，无需 filesort。
ALTER TABLE message_notification
    ADD INDEX idx_account_channel_time (account_id, channel, created_at);

-- ── 1000 条压测种子数据（递归 CTE，无需存储过程，兼容 Flyway） ──────
INSERT INTO message_notification
    (account_id, biz_type, biz_id, title, content,
     channel, is_read, read_at, send_status, send_at, created_at)
WITH RECURSIVE seq (n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 1000
)
SELECT
    4                                                                AS account_id,
    ELT((n - 1) MOD 4 + 1, 'MATCH', 'AUDIT', 'ACTIVITY', 'SYSTEM') AS biz_type,
    ((n - 1) MOD 50) + 1                                            AS biz_id,
    CONCAT('[压测] ', ELT((n - 1) MOD 4 + 1, 'MATCH', 'AUDIT', 'ACTIVITY', 'SYSTEM'),
           ' 通知 #', n)                                            AS title,
    CONCAT('压测消息 #', n, '，biz_type=',
           ELT((n - 1) MOD 4 + 1, 'MATCH', 'AUDIT', 'ACTIVITY', 'SYSTEM'),
           '，用于验证 1000 条历史记录列表查询 ≤ 300ms。')          AS content,
    'SITE'                                                           AS channel,
    n MOD 2                                                          AS is_read,
    -- 偶数条（已读）记录阅读时间，奇数条为 NULL
    IF(n MOD 2 = 0,
       DATE_ADD('2026-01-01 08:00:00', INTERVAL (n * 14400 + 1800) SECOND),
       NULL)                                                         AS read_at,
    1                                                                AS send_status,
    -- 时间戳：每 4 小时一条，1000 条跨越 2026-01 ~ 2026-06（6 个分区）
    DATE_ADD('2026-01-01 08:00:00', INTERVAL (n * 14400) SECOND)    AS send_at,
    DATE_ADD('2026-01-01 08:00:00', INTERVAL (n * 14400) SECOND)    AS created_at
FROM seq;
