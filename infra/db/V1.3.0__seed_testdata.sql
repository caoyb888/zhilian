-- ============================================================
-- 绿产智链（Green-Link）测试环境种子数据
-- 版本：V1.3.0
-- 说明：覆盖会员/账号/标签/文章/活动/供需/对接主场景
--       所有测试账号密码均为 Gl@2026
-- ============================================================

SET NAMES utf8mb4;

-- ============================================================
-- gl_member — 权限项 + 角色权限关联（V1.1.0 未在内网机执行，此处补入）
-- ============================================================
USE gl_member;

INSERT INTO rbac_permission (id, code, name, type, parent_id, sort_order) VALUES
(1,  'supply',                   '供需管理',     1, NULL, 1),
(2,  'member',                   '会员管理',     1, NULL, 2),
(3,  'portal',                   '门户管理',     1, NULL, 3),
(4,  'rbac',                     '权限管理',     1, NULL, 4),
(11, 'supply:resource:list',     '资源列表',     2, 1, 1),
(12, 'supply:resource:publish',  '发布资源',     2, 1, 2),
(13, 'supply:resource:audit',    '审核资源',     2, 1, 3),
(14, 'supply:demand:list',       '需求列表',     2, 1, 4),
(15, 'supply:demand:publish',    '发布需求',     2, 1, 5),
(21, 'member:list',              '会员列表',     2, 2, 1),
(22, 'member:audit',             '审核会员',     2, 2, 2),
(23, 'member:account:manage',    '账号管理',     2, 2, 3),
(31, 'portal:article:manage',    '文章管理',     2, 3, 1),
(32, 'portal:article:publish',   '发布文章',     2, 3, 2),
(33, 'portal:activity:manage',   '活动管理',     2, 3, 3),
(41, 'rbac:role:manage',         '角色权限管理', 2, 4, 1);

-- SUPER_ADMIN: 全部权限
INSERT INTO rbac_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM rbac_role r JOIN rbac_permission p ON 1=1
WHERE r.code = 'SUPER_ADMIN' AND r.is_deleted = 0 AND p.is_deleted = 0;

-- CONTENT_ADMIN: 门户全部 + 供需只读
INSERT INTO rbac_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM rbac_role r JOIN rbac_permission p
  ON p.code IN ('portal','portal:article:manage','portal:article:publish',
                'portal:activity:manage','supply','supply:resource:list','supply:demand:list')
WHERE r.code = 'CONTENT_ADMIN' AND r.is_deleted = 0 AND p.is_deleted = 0;

-- AUDITOR: 审核相关
INSERT INTO rbac_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM rbac_role r JOIN rbac_permission p
  ON p.code IN ('supply','supply:resource:list','supply:resource:audit',
                'supply:demand:list','member','member:list','member:audit')
WHERE r.code = 'AUDITOR' AND r.is_deleted = 0 AND p.is_deleted = 0;

-- MEMBER: 供需发布与浏览
INSERT INTO rbac_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM rbac_role r JOIN rbac_permission p
  ON p.code IN ('supply','supply:resource:list','supply:resource:publish',
                'supply:demand:list','supply:demand:publish')
WHERE r.code = 'MEMBER' AND r.is_deleted = 0 AND p.is_deleted = 0;

-- ============================================================
-- 会员单位（4 家企业）
-- ============================================================
INSERT INTO member_unit
  (id, name, short_name, industry, province, city, member_level,
   credit_score, introduction, contact_name, contact_phone, contact_email,
   is_certified, status, join_date)
VALUES
(2, '山东绿能科技有限公司',       '绿能科技',   '新能源',   '山东省', '济南市', 2, 98.50,
   '专注光伏逆变器研发与销售，是国内领先的新能源设备供应商，产品出口20余国。',
   '李明', '13800138002', 'admin@lvneng.com', 1, 1, '2024-03-15'),
(3, '青岛碳汇环保集团有限公司',   '碳汇集团',   '节能环保', '山东省', '青岛市', 3, 99.00,
   '专业从事碳汇开发、碳核查及环保技术咨询，拥有国家认可碳核查资质，服务企业逾300家。',
   '张伟', '13900139003', 'admin@tanhu.com',  1, 1, '2023-08-20'),
(4, '济南光辉光伏设备制造有限公司','光辉光伏',   '光伏制造', '山东省', '济南市', 1, 95.00,
   '专注光伏组件及相关设备制造，年产能超 500MW，产品通过 IEC/CQC 认证。',
   '王芳', '13700137004', 'admin@guanghui.com', 0, 1, '2025-01-10'),
(5, '烟台风驰能源技术研究院',     '风驰研究院', '风能技术', '山东省', '烟台市', 1, 90.00,
   '专注风电技术研究与成果转化，在风机叶片设计与智能运维领域持有多项发明专利。',
   '陈磊', '13600136005', 'admin@fengchi.com',  0, 2, '2025-06-01');

-- ============================================================
-- 会员账号（密码均为 Gl@2026 的 BCrypt hash）
-- ============================================================
INSERT INTO member_account
  (id, member_id, parent_id, username, password_hash,
   phone, email, real_name, status)
VALUES
-- 协会运营侧
(2, 1, NULL, 'content_admin', '$2b$10$dJXTFKfR13FeqlLB/Um.XOFfEUpH35Dx5OVnwdQS1AcKIgA9OQc5K',
 '13800138012', 'content@greenlink.com',  '内容管理员', 1),
(3, 1, NULL, 'auditor01',     '$2b$10$dJXTFKfR13FeqlLB/Um.XOFfEUpH35Dx5OVnwdQS1AcKIgA9OQc5K',
 '13800138013', 'auditor@greenlink.com',  '审核员',     1),
-- 绿能科技（主账号 + 集团子账号）
(4, 2, NULL, 'lvneng_main',   '$2b$10$dJXTFKfR13FeqlLB/Um.XOFfEUpH35Dx5OVnwdQS1AcKIgA9OQc5K',
 '13800138014', 'main@lvneng.com',        '李明',       1),
(5, 2, 4,   'lvneng_sub1',   '$2b$10$dJXTFKfR13FeqlLB/Um.XOFfEUpH35Dx5OVnwdQS1AcKIgA9OQc5K',
 '13800138015', 'sub1@lvneng.com',        '赵强',       1),
-- 碳汇集团
(6, 3, NULL, 'tanhu_main',    '$2b$10$dJXTFKfR13FeqlLB/Um.XOFfEUpH35Dx5OVnwdQS1AcKIgA9OQc5K',
 '13900139016', 'main@tanhu.com',         '张伟',       1),
-- 光辉光伏
(7, 4, NULL, 'guanghui_main', '$2b$10$dJXTFKfR13FeqlLB/Um.XOFfEUpH35Dx5OVnwdQS1AcKIgA9OQc5K',
 '13700137017', 'main@guanghui.com',      '王芳',       1),
-- 风驰研究院（所属单位状态=审核中）
(8, 5, NULL, 'fengchi_main',  '$2b$10$dJXTFKfR13FeqlLB/Um.XOFfEUpH35Dx5OVnwdQS1AcKIgA9OQc5K',
 '13600136018', 'main@fengchi.com',       '陈磊',       1);

-- 账号角色分配
INSERT INTO rbac_account_role (account_id, role_id)
SELECT 2, id FROM rbac_role WHERE code = 'CONTENT_ADMIN' UNION ALL
SELECT 3, id FROM rbac_role WHERE code = 'AUDITOR'       UNION ALL
SELECT 4, id FROM rbac_role WHERE code = 'VIP_MEMBER'    UNION ALL
SELECT 5, id FROM rbac_role WHERE code = 'MEMBER'        UNION ALL
SELECT 6, id FROM rbac_role WHERE code = 'VIP_MEMBER'    UNION ALL
SELECT 7, id FROM rbac_role WHERE code = 'MEMBER'        UNION ALL
SELECT 8, id FROM rbac_role WHERE code = 'MEMBER';

-- 登录日志样本
INSERT INTO member_login_log (account_id, login_time, ip, terminal, result, fail_reason) VALUES
(1, '2026-06-01 09:00:00', '10.30.10.100', 'PC',     1, NULL),
(1, '2026-06-02 08:30:00', '10.30.10.100', 'PC',     1, NULL),
(4, '2026-06-03 10:15:00', '10.30.10.101', 'H5',     1, NULL),
(4, '2026-06-04 09:00:00', '10.30.10.101', 'PC',     1, NULL),
(6, '2026-06-01 14:22:00', '10.30.10.102', 'PC',     1, NULL),
(7, '2026-06-02 16:40:00', '10.30.10.103', 'WECHAT', 1, NULL),
(7, '2026-06-03 08:05:00', '10.30.10.103', 'PC',     0, '密码错误');

-- ============================================================
-- gl_common — 标签
-- ============================================================
USE gl_common;

INSERT INTO tag (id, category_id, name, alias, sort_order) VALUES
-- 行业领域 (category_id=1)
(1,  1, '新能源',     '清洁能源,renewable energy',          1),
(2,  1, '节能环保',   '节能减排,环保技术',                   2),
(3,  1, '光伏',       '太阳能,PV,solar,光伏发电',            3),
(4,  1, '风能',       '风电,wind power,风力发电',            4),
(5,  1, '储能',       '电化学储能,energy storage,锂储能',    5),
(6,  1, '氢能',       '绿氢,氢燃料电池,hydrogen',            6),
(7,  1, '碳汇',       '碳减排,碳中和,碳捕捉,carbon sink',    7),
-- 资源类型 (category_id=2)
(11, 2, '产品销售',   '成套设备,产品供应',                   1),
(12, 2, '技术转让',   '专利转让,技术出售',                   2),
(13, 2, '技术授权',   '专利授权,许可使用',                   3),
(14, 2, '人才输出',   '专家服务,技术派遣',                   4),
-- 需求类型 (category_id=3)
(21, 3, '产品采购',   '设备采购,批量采购',                   1),
(22, 3, '技术引进',   '技术购买,技术合作引进',               2),
(23, 3, '人才招募',   '招聘,人才引进',                       3),
-- 政策领域 (category_id=4)
(31, 4, '碳减排政策', '双碳政策,碳市场,碳交易',             1),
(32, 4, '新能源补贴', '光伏补贴,风电补贴,绿电政策',         2),
(33, 4, '绿色认证',   'ISO认证,绿色标准,绿色标识',           3),
-- 认证类型 (category_id=5)
(41, 5, 'ISO14001',   '环境管理体系,ISO 14001',             1),
(42, 5, '绿色产品认证','国家绿色产品,绿色标识认证',           2),
-- 技术领域 (category_id=6)
(51, 6, '光伏逆变技术','逆变器,MPPT算法,光伏并网',           1),
(52, 6, '储能电池技术','锂电池,BMS,电池管理系统',            2),
(53, 6, '风机叶片设计','叶片气动,复合材料,叶片制造',         3);

-- ============================================================
-- gl_portal — 文章、活动、轮播图
-- ============================================================
USE gl_portal;

-- 文章（6篇：新闻2、通知2、政策2，含草稿、置顶等场景）
INSERT INTO portal_article
  (id, category_id, title, summary, author, view_count,
   is_top, is_published, published_at, publisher_id)
VALUES
(1, 1, '山东省绿色低碳产业发展报告2026：新能源装机突破1亿千瓦',
   '截至2026年5月，山东省新能源装机总量突破1亿千瓦，光伏、风电、储能协同发展态势良好。',
   '协会研究部', 1280, 1, 1, '2026-05-20 10:00:00', 2),
(2, 1, '国内光伏组件出口一季度再创新高，山东企业贡献显著',
   '2026年一季度，国内光伏组件出口总量同比增长23%，山东省出口额位居全国第三。',
   '新能源观察', 856, 0, 1, '2026-04-15 09:30:00', 2),
(3, 2, '关于举办2026年度绿色低碳产业供需对接交流会的通知',
   '协会定于2026年7月15日在济南举办年度供需对接交流会，诚邀全体会员单位参与。',
   '协会秘书处', 342, 1, 1, '2026-06-01 08:00:00', 2),
(4, 2, '2026年度会员信息年度更新工作说明',
   '请各会员单位于2026年6月30日前完成年度信息更新，逾期将影响会员评级。',
   '协会会员部', 0, 0, 0, NULL, NULL),
(5, 3, '《山东省绿色低碳发展三年行动计划（2025-2027）》政策解读',
   '深度解读省发改委最新发布的绿色低碳三年行动计划，梳理重点支持领域与申报要点。',
   '政策研究室', 2103, 1, 1, '2026-03-10 14:00:00', 1),
(6, 3, '国家发改委：扩大碳排放权交易市场覆盖范围，新增建材等四个行业',
   '碳排放权交易市场将于2026年下半年新增建材、钢铁、有色、化工四个行业。',
   '新华社', 1567, 0, 1, '2026-05-28 16:00:00', 1);

-- 活动（2个：报名中 + 已结束）
INSERT INTO portal_activity
  (id, title, content, location, start_time, end_time,
   reg_deadline, max_capacity, reg_count, status)
VALUES
(1, '2026年绿色低碳产业供需对接交流会',
   '<p>本次交流会以"绿色赋能·链接未来"为主题，设置主旨演讲、圆桌论坛、一对一供需对接洽谈三大环节。</p>',
   '济南市历下区鲁能JW万豪酒店',
   '2026-07-15 09:00:00', '2026-07-15 18:00:00', '2026-07-10 23:59:59', 200, 3, 2),
(2, '新能源技术创新研讨会暨成果展示',
   '<p>本次研讨会聚焦光伏、风能、储能三大领域技术创新，多家成员单位展示最新技术成果。</p>',
   '青岛市崂山区国际会议中心',
   '2026-04-20 09:00:00', '2026-04-21 17:00:00', '2026-04-15 23:59:59', 150, 89, 4);

-- 活动报名（activity_1: 3人报名；activity_2: 2人已签到）
INSERT INTO portal_activity_signup (activity_id, account_id, member_id, status) VALUES
(1, 4, 2, 1),
(1, 6, 3, 1),
(1, 7, 4, 1),
(2, 4, 2, 2),
(2, 6, 3, 2);

-- 轮播图（3张，含定时展示场景）
INSERT INTO portal_banner
  (title, image_url, link_url, link_type, sort_order, show_start, show_end, is_active)
VALUES
('2026供需对接交流会—立即报名',
 '/static/banner/banner_01.jpg', '/activity/1', 1, 1,
 '2026-06-01 00:00:00', '2026-07-15 23:59:59', 1),
('绿色低碳产业发展报告2026 免费下载',
 '/static/banner/banner_02.jpg', '/portal/article/1', 1, 2,
 NULL, NULL, 1),
('加入绿产智链，共建低碳未来',
 '/static/banner/banner_03.jpg', '/member/register', 1, 3,
 NULL, NULL, 1);

-- ============================================================
-- gl_supply — 资源（5条）、需求（4条）
-- ============================================================
USE gl_supply;

-- 资源：PRODUCT已审、TECHNOLOGY已审、PRODUCT待审、TALENT已审、TECHNOLOGY被拒
INSERT INTO supply_resource
  (id, member_id, account_id, type, title, summary,
   province, city, cooperation_mode, valid_until, view_count,
   audit_status, auditor_id, audited_at)
VALUES
(1, 2, 4, 'PRODUCT',
   '第三代高效单晶硅光伏逆变器 GN-INV-3000（100kW）',
   '采用自研 MPPT 算法，转换效率 99.1%，支持多路并联，适用于分布式及大型地面电站，已获 CQC 认证。',
   '山东省', '济南市', '产品销售/定制开发/长期采购',
   '2026-12-31', 312, 1, 3, '2026-05-10 14:30:00'),
(2, 3, 6, 'TECHNOLOGY',
   '企业碳排放数字化核算与管理平台（SaaS版）',
   '覆盖碳核查、碳配额管理、CCER开发全流程，已在20余家企业落地，符合 MRV 标准要求。',
   '山东省', '青岛市', '技术授权/SaaS订阅/私有化部署',
   '2027-06-30', 478, 1, 3, '2026-05-08 10:00:00'),
(3, 4, 7, 'PRODUCT',
   '高效双面双玻光伏组件 GH-M10-550W',
   '采用 M10 大尺寸硅片，功率 550W，双面发电增益 8%，通过 IEC 61215/61730 认证。',
   '山东省', '济南市', '产品销售/批量采购',
   '2026-09-30', 156, 0, NULL, NULL),
(4, 2, 5, 'TALENT',
   '光伏电站 EPC 工程服务团队（可外派）',
   '15名经验丰富的光伏工程师，具备 MW 级电站设计、施工及并网全程服务能力，已承接多个省级项目。',
   '山东省', '济南市', '技术服务/合同工程',
   '2026-12-31', 88, 1, 3, '2026-05-25 09:00:00'),
(5, 3, 6, 'TECHNOLOGY',
   '绿色建筑碳足迹评估技术方案',
   '为建筑行业提供全生命周期碳足迹核算与评估服务，满足国标 GB/T 51366 要求。',
   '山东省', '青岛市', '技术服务/咨询',
   NULL, 45, 2, 3, '2026-06-01 11:00:00');

-- 需求：PRODUCT已审、TECHNOLOGY已审、TALENT待审、TECHNOLOGY已审
INSERT INTO supply_demand
  (id, member_id, account_id, type, title, summary,
   province, budget_min, budget_max, deadline, cooperation_mode,
   view_count, audit_status, auditor_id, audited_at)
VALUES
(1, 3, 6, 'PRODUCT',
   '光伏逆变器批量采购需求（1000台/年）',
   '需采购 5kW-100kW 各型逆变器共 1000 台，效率 ≥98.5%，具备三级防雷，需有 CQC 认证。',
   '山东省', 200.00, 500.00, '2026-08-31', '长期采购合作',
   234, 1, 3, '2026-05-12 15:00:00'),
(2, 4, 7, 'TECHNOLOGY',
   '企业碳排放核算系统引进与本地化部署',
   '引进完整碳排放核算管理系统，支持私有化部署，覆盖5个生产环节，提供2年运维服务。',
   '山东省', 50.00, 150.00, '2026-09-30', '系统购买+实施服务',
   189, 1, 3, '2026-05-15 16:00:00'),
(3, 2, 4, 'TALENT',
   '储能系统运维工程师招募（3名）',
   '招募具备锂电池储能系统现场运维经验的工程师，要求持有电工证及相关资质，驻场烟台。',
   '山东省', NULL, NULL, '2026-07-31', '劳务合作/长期',
   67, 0, NULL, NULL),
(4, 5, 8, 'TECHNOLOGY',
   '风电场智能化运维技术合作开发',
   '与具备风电大数据分析能力的技术方合作，共同开发风机健康诊断与预测性维护系统。',
   '山东省', 30.00, 100.00, '2026-12-31', '联合开发/收益分成',
   112, 1, 3, '2026-05-20 10:00:00');

-- ============================================================
-- gl_match — 对接记录、沟通消息、收藏
-- ============================================================
USE gl_match;

-- 对接记录：洽谈中 / 已接受 / 待响应
INSERT INTO match_record
  (id, resource_id, demand_id, resource_member_id, demand_member_id,
   match_score, match_type, status, initiator_id, apply_message)
VALUES
(1, 1, 1, 2, 3, 87.50, 1, 3, 6,
   '贵司逆变器产品与我方采购需求高度匹配，诚邀进一步洽谈合作框架。'),
(2, 2, 2, 3, 4, 92.30, 1, 2, 7,
   '已了解贵方碳排放核算平台，希望就本地化部署方案进行详细沟通。'),
(3, 4, 3, 2, 2, NULL, 2, 1, 4,
   '我方有资深光伏工程师团队，可满足贵司储能运维人才需求，请查收材料。');

-- 对接沟通消息（match_id=1 三来三往，match_id=2 两条）
INSERT INTO match_message (match_id, sender_id, content, msg_type, is_read) VALUES
(1, 6, '您好，我们对贵司光伏逆变器产品非常感兴趣，请问是否有详细规格书？', 1, 1),
(1, 4, '感谢关注！主要参数：额定功率100kW，MPPT效率99.1%，三相380V并网，详细规格书已发送。', 1, 1),
(1, 6, '资料已收到，我们评估后与您进一步沟通价格及交货周期。', 1, 0),
(2, 7, '您好，我们有意向引进碳核算平台，请问能否安排一次在线演示？', 1, 1),
(2, 6, '当然可以，请问本周四下午两点方便吗？可通过腾讯会议进行系统演示。', 1, 0);

-- 收藏
INSERT INTO match_favorite (account_id, biz_type, biz_id) VALUES
(4, 'DEMAND',   1),
(6, 'RESOURCE', 1),
(6, 'RESOURCE', 4),
(7, 'RESOURCE', 2),
(7, 'DEMAND',   4);

-- ============================================================
-- gl_common — 业务标签关联
-- ============================================================
USE gl_common;

INSERT INTO tag_relation (biz_type, biz_id, tag_id) VALUES
-- 会员单位
('MEMBER', 2, 1),  ('MEMBER', 2, 3),  ('MEMBER', 2, 51),
('MEMBER', 3, 2),  ('MEMBER', 3, 7),  ('MEMBER', 3, 31),
('MEMBER', 4, 3),  ('MEMBER', 4, 41),
('MEMBER', 5, 4),  ('MEMBER', 5, 53),
-- 资源
('RESOURCE', 1, 3),  ('RESOURCE', 1, 1),  ('RESOURCE', 1, 51), ('RESOURCE', 1, 11),
('RESOURCE', 2, 7),  ('RESOURCE', 2, 2),  ('RESOURCE', 2, 13),
('RESOURCE', 3, 3),  ('RESOURCE', 3, 11),
('RESOURCE', 4, 3),  ('RESOURCE', 4, 14),
('RESOURCE', 5, 7),  ('RESOURCE', 5, 2),
-- 需求
('DEMAND', 1, 3),  ('DEMAND', 1, 21),
('DEMAND', 2, 7),  ('DEMAND', 2, 22),
('DEMAND', 3, 5),  ('DEMAND', 3, 23),
('DEMAND', 4, 4),  ('DEMAND', 4, 22),
-- 文章
('ARTICLE', 1, 1), ('ARTICLE', 1, 3),  ('ARTICLE', 1, 4),
('ARTICLE', 2, 3), ('ARTICLE', 2, 1),
('ARTICLE', 3, 1), ('ARTICLE', 3, 2),
('ARTICLE', 5, 7), ('ARTICLE', 5, 31),
('ARTICLE', 6, 7), ('ARTICLE', 6, 31),
-- 活动
('ACTIVITY', 1, 1), ('ACTIVITY', 1, 2),
('ACTIVITY', 2, 1), ('ACTIVITY', 2, 3), ('ACTIVITY', 2, 4);
