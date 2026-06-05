export interface MenuItem {
  path: string
  label: string
  icon: string        // Unicode emoji，后续可替换为 Heroicons
  permission?: string // undefined = 所有管理员可见
}

export const adminMenuConfig: MenuItem[] = [
  { path: '/admin/dashboard',    label: '控制台',   icon: '🏠' },
  { path: '/admin/members',      label: '会员管理', icon: '🏢', permission: 'member:unit:list' },
  { path: '/admin/members/audit',label: '会员审核', icon: '✅', permission: 'member:unit:audit' },
  { path: '/admin/articles',     label: '文章管理', icon: '📄', permission: 'portal:article:list' },
  { path: '/admin/activities',   label: '活动管理', icon: '📅', permission: 'portal:activity:list' },
  { path: '/admin/tags',         label: '标签管理', icon: '🏷️', permission: 'tag:list' },
  { path: '/admin/supply-audit', label: '资源审核', icon: '🔍', permission: 'supply:resource:audit' },
]
