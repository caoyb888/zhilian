-- ==========================================
-- 首页轮播图数据迁移
-- 来源: https://www.glca.org.cn/ 首页 hero-banners
-- ==========================================

USE gl_portal;

-- 先删除已存在的旧站轮播图（避免重复插入）
DELETE FROM portal_banner WHERE title IN (
  '千企行首站滨州起势：协会把"政产学研金服用"协同生态搬到滨州',
  '关于公开征集智慧交通专业委员会参与单位的通知',
  '关于举办"碳路先锋"企业双碳实战训练营的通知'
);

INSERT INTO portal_banner
  (title, image_url, link_url, link_type, sort_order, show_start, show_end, is_active, is_deleted, created_at, updated_at)
VALUES
  ('千企行首站滨州起势：协会把“政产学研金服用”协同生态搬到滨州', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/6a801fb275d24dc385200d4cb1db2253mub269dt9p.png', '/activity', 1, 1, NULL, NULL, 1, 0, NOW(), NOW()),
  ('关于公开征集智慧交通专业委员会参与单位的通知', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/33a427bbb2ce460d80e6c11eeb7ca212ewi4dqaqvt.png', '/news', 1, 2, NULL, NULL, 1, 0, NOW(), NOW()),
  ('关于举办“碳路先锋”企业双碳实战训练营的通知', 'http://10.30.10.49:9020/greenlink-public/legacy/portal/images/1deae590dbc5434b8e76f678aa8a41cdvju6zd7yni.png', '/news', 1, 3, NULL, NULL, 1, 0, NOW(), NOW());