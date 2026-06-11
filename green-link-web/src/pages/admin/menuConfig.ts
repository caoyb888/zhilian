import type { LucideIcon } from 'lucide-react'
import {
  Home,
  Building2,
  CheckCircle2,
  FileText,
  CalendarDays,
  Tag,
  Search,
} from 'lucide-react'

export interface MenuItem {
  path: string
  label: string
  icon: LucideIcon
  permission?: string // undefined = 所有管理员可见
}

export const adminMenuConfig: MenuItem[] = [
  { path: '/admin/dashboard',     label: '控制台',   icon: Home },
  { path: '/admin/search',        label: '全局搜索', icon: Search },
  { path: '/admin/members',       label: '会员管理', icon: Building2, permission: 'member:unit:list' },
  { path: '/admin/members/audit', label: '会员审核', icon: CheckCircle2, permission: 'member:unit:audit' },
  { path: '/admin/articles',      label: '文章管理', icon: FileText, permission: 'portal:article:list' },
  { path: '/admin/activities',    label: '活动管理', icon: CalendarDays, permission: 'portal:activity:list' },
  { path: '/admin/tags',          label: '标签管理', icon: Tag, permission: 'tag:list' },
  { path: '/admin/supply-audit',  label: '供需审核', icon: Search, permission: 'supply:resource:audit' },
]
