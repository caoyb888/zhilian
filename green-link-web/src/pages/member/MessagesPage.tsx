import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  Activity,
  Bell,
  CheckCheck,
  ExternalLink,
  Handshake,
  Info,
  ShieldCheck,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/Button'
import { Pagination } from '@/components/Pagination'
import { EmptyState } from '@/components/states/EmptyState'
import { SkeletonList } from '@/components/states/SkeletonList'
import {
  useNotifications,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
  type BizType,
  type NotificationItem,
} from '@/services/messageService'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15

// ─── Tab definitions ──────────────────────────────────────────────────────────

interface TabDef {
  key: 'all' | BizType
  label: string
  bizType?: BizType
  icon: typeof Bell
}

const TABS: TabDef[] = [
  { key: 'all',      label: '全部',     icon: Bell },
  { key: 'MATCH',    label: '对接',     bizType: 'MATCH',    icon: Handshake },
  { key: 'AUDIT',    label: '审核',     bizType: 'AUDIT',    icon: ShieldCheck },
  { key: 'ACTIVITY', label: '活动',     bizType: 'ACTIVITY', icon: Activity },
  { key: 'SYSTEM',   label: '系统',     bizType: 'SYSTEM',   icon: Info },
]

// ─── biz_type metadata ────────────────────────────────────────────────────────

const BIZ_META: Record<BizType, { label: string; cls: string }> = {
  MATCH:    { label: '对接', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  AUDIT:    { label: '审核', cls: 'bg-orange-50 text-orange-700 border border-orange-200' },
  ACTIVITY: { label: '活动', cls: 'bg-teal-50 text-teal-700 border border-teal-200' },
  SYSTEM:   { label: '系统', cls: 'bg-stone-100 text-stone-600 border border-stone-200' },
}

// ─── Link helper ──────────────────────────────────────────────────────────────

function getLinkPath(item: NotificationItem): string | null {
  if (!item.bizId) return null
  if (item.bizType === 'MATCH') return `/member/my-records/${item.bizId}/chat`
  if (item.bizType === 'ACTIVITY') return `/portal/activities/${item.bizId}`
  return null
}

// ─── Format time ──────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} 小时前`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD} 天前`
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

// ─── Notification card ────────────────────────────────────────────────────────

function NotificationCard({
  item,
  onRead,
}: {
  item: NotificationItem
  onRead: (id: number) => void
}) {
  const linkPath = getLinkPath(item)
  const bizMeta = item.bizType ? BIZ_META[item.bizType] : null
  const navigate = useNavigate()

  function handleCardClick() {
    if (!item.isRead) onRead(item.id)
    if (linkPath) navigate(linkPath)
  }

  return (
    <div
      className={clsx(
        'group flex gap-4 rounded-xl border bg-white p-4 transition-all duration-150',
        item.isRead
          ? 'border-stone-100 hover:border-stone-200 hover:shadow-card'
          : 'border-emerald-100 bg-emerald-50/30 hover:border-emerald-200 hover:shadow-card',
        linkPath && 'cursor-pointer',
      )}
      onClick={linkPath ? handleCardClick : undefined}
      role={linkPath ? 'button' : undefined}
    >
      {/* Unread dot */}
      <div className="shrink-0 pt-1">
        <span
          className={clsx(
            'block h-2 w-2 rounded-full transition-colors',
            item.isRead ? 'bg-transparent' : 'bg-emerald-500',
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {bizMeta && (
              <span className={clsx('rounded px-1.5 py-0.5 text-[10px] font-semibold', bizMeta.cls)}>
                {bizMeta.label}
              </span>
            )}
            <p
              className={clsx(
                'text-sm leading-snug',
                item.isRead ? 'text-stone-700 font-normal' : 'text-stone-900 font-semibold',
              )}
            >
              {item.title}
            </p>
          </div>
          <span className="shrink-0 text-xs text-stone-400">{formatTime(item.createdAt)}</span>
        </div>

        {item.content && (
          <p className="mt-1 text-xs text-stone-500 leading-relaxed line-clamp-2">
            {item.content}
          </p>
        )}

        {linkPath && (
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 group-hover:text-emerald-700">
            <Icon icon={ExternalLink} size={11} />
            <span>{item.bizType === 'MATCH' ? '进入对接沟通' : '查看详情'}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = (searchParams.get('tab') ?? 'all') as TabDef['key']
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const activeBizType = TABS.find((t) => t.key === tab)?.bizType

  const { data, isLoading } = useNotifications({
    page,
    size: PAGE_SIZE,
    bizType: activeBizType,
  })

  const { data: unreadCount } = useUnreadCount()

  const markReadMutation = useMarkRead()
  const markAllMutation = useMarkAllRead()

  const handleRead = useCallback(
    (id: number) => markReadMutation.mutate(id),
    [markReadMutation],
  )

  function handleTabChange(key: TabDef['key']) {
    setSearchParams({ tab: key, page: '1' })
  }

  function handlePageChange(p: number) {
    setSearchParams({ tab, page: String(p) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleMarkAll() {
    markAllMutation.mutate(activeBizType)
  }

  // Unread count per tab
  function tabUnread(t: TabDef): number {
    if (!unreadCount) return 0
    if (t.key === 'all') return unreadCount.total
    return unreadCount[t.key as BizType] ?? 0
  }

  const hasUnread =
    unreadCount &&
    (activeBizType ? unreadCount[activeBizType] > 0 : unreadCount.total > 0)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-theme-text-main flex items-center gap-2">
            <Icon icon={Bell} size={20} className="text-emerald-500" />
            消息中心
          </h1>
          {unreadCount && unreadCount.total > 0 && (
            <p className="mt-0.5 text-xs text-stone-400">
              共 {unreadCount.total} 条未读消息
            </p>
          )}
        </div>

        {hasUnread && (
          <Button
            variant="secondary"
            size="sm"
            loading={markAllMutation.isPending}
            onClick={handleMarkAll}
          >
            <Icon icon={CheckCheck} size={14} className="mr-1.5" />
            {activeBizType ? `全部已读（${BIZ_META[activeBizType].label}）` : '全部已读'}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-stone-100 bg-white p-1 shadow-card">
        {TABS.map((t) => {
          const count = tabUnread(t)
          const isActive = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTabChange(t.key)}
              className={clsx(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800',
              )}
            >
              <Icon icon={t.icon} size={14} />
              <span className="hidden sm:inline">{t.label}</span>
              {count > 0 && (
                <span
                  className={clsx(
                    'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                    isActive ? 'bg-white/30 text-white' : 'bg-red-500 text-white',
                  )}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <SkeletonList count={6} />
      ) : !data?.records.length ? (
        <EmptyState
          icon={Bell}
          title="暂无消息"
          description={activeBizType ? `没有${BIZ_META[activeBizType].label}类消息` : '您还没有收到任何站内消息'}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {data.records.map((item) => (
            <NotificationCard key={item.id} item={item} onRead={handleRead} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.pages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}
