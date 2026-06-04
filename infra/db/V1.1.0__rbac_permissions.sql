-- V1.1.0 — 权限项基础数据 + 角色-权限关联初始化
-- 执行库：gl_member

USE gl_member;

-- ─────────────────────────────────────────────────────
-- 1. 权限项（菜单级 type=1，按钮/操作级 type=2）
-- ─────────────────────────────────────────────────────

INSERT INTO rbac_permission (id, code, name, type, parent_id, sort_order) VALUES
-- 菜单
(1,  'supply',                   '供需管理',   1, NULL, 1),
(2,  'member',                   '会员管理',   1, NULL, 2),
(3,  'portal',                   '门户管理',   1, NULL, 3),
(4,  'rbac',                     '权限管理',   1, NULL, 4),
-- 供需管理子权限
(11, 'supply:resource:list',     '资源列表',   2, 1, 1),
(12, 'supply:resource:publish',  '发布资源',   2, 1, 2),
(13, 'supply:resource:audit',    '审核资源',   2, 1, 3),
(14, 'supply:demand:list',       '需求列表',   2, 1, 4),
(15, 'supply:demand:publish',    '发布需求',   2, 1, 5),
-- 会员管理子权限
(21, 'member:list',              '会员列表',   2, 2, 1),
(22, 'member:audit',             '审核会员',   2, 2, 2),
(23, 'member:account:manage',    '账号管理',   2, 2, 3),
-- 门户管理子权限
(31, 'portal:article:manage',    '文章管理',   2, 3, 1),
(32, 'portal:article:publish',   '发布文章',   2, 3, 2),
(33, 'portal:activity:manage',   '活动管理',   2, 3, 3),
-- 权限管理子权限
(41, 'rbac:role:manage',         '角色权限管理', 2, 4, 1);

-- ─────────────────────────────────────────────────────
-- 2. 角色-权限关联初始化
-- ─────────────────────────────────────────────────────

-- SUPER_ADMIN: 全部权限
INSERT INTO rbac_role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM rbac_role r
JOIN rbac_permission p ON 1=1
WHERE r.code = 'SUPER_ADMIN' AND r.is_deleted = 0 AND p.is_deleted = 0;

-- CONTENT_ADMIN: 门户管理全部 + 供需列表只读
INSERT INTO rbac_role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM rbac_role r
JOIN rbac_permission p ON p.code IN ('portal', 'portal:article:manage', 'portal:article:publish',
    'portal:activity:manage', 'supply', 'supply:resource:list', 'supply:demand:list')
WHERE r.code = 'CONTENT_ADMIN' AND r.is_deleted = 0 AND p.is_deleted = 0;

-- AUDITOR: 审核相关权限
INSERT INTO rbac_role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM rbac_role r
JOIN rbac_permission p ON p.code IN ('supply', 'supply:resource:list', 'supply:resource:audit',
    'supply:demand:list', 'member', 'member:list', 'member:audit')
WHERE r.code = 'AUDITOR' AND r.is_deleted = 0 AND p.is_deleted = 0;
