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
  dot: string
}

const TABS: TabDef[] = [
  { key: 'all',      label: '全部', icon: Bell,        dot: 'bg-stone-300' },
  { key: 'MATCH',    label: '对接', bizType: 'MATCH',    icon: Handshake,   dot: 'bg-emerald-500' },
  { key: 'AUDIT',    label: '审核', bizType: 'AUDIT',    icon: ShieldCheck,  dot: 'bg-orange-500' },
  { key: 'ACTIVITY', label: '活动', bizType: 'ACTIVITY', icon: Activity,     dot: 'bg-teal-500' },
  { key: 'SYSTEM',   label: '系统', bizType: 'SYSTEM',   icon: Info,         dot: 'bg-stone-400' },
]

// ─── Biz type icon config ─────────────────────────────────────────────────────

const BIZ_CONFIG: Record<BizType, {
  icon: typeof Handshake
  readCls: string
  unreadCls: string
  leftBar: string   // 未读左色条
  chip: string      // 业务类型标签
}> = {
  MATCH:    { icon: Handshake,   readCls: 'bg-emerald-100 text-emerald-500', unreadCls: 'bg-emerald-500 text-white', leftBar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  AUDIT:    { icon: ShieldCheck, readCls: 'bg-orange-100 text-orange-500',   unreadCls: 'bg-orange-500 text-white',  leftBar: 'bg-orange-400',  chip: 'bg-orange-50 text-orange-700 border-orange-200' },
  ACTIVITY: { icon: Activity,    readCls: 'bg-teal-100 text-teal-500',       unreadCls: 'bg-teal-500 text-white',    leftBar: 'bg-teal-500',    chip: 'bg-teal-50 text-teal-700 border-teal-200' },
  SYSTEM:   { icon: Info,        readCls: 'bg-stone-100 text-stone-400',     unreadCls: 'bg-stone-500 text-white',   leftBar: 'bg-stone-400',   chip: 'bg-stone-100 text-stone-600 border-stone-200' },
}

const BIZ_LABEL: Record<BizType, string> = {
  MATCH: '对接', AUDIT: '审核', ACTIVITY: '活动', SYSTEM: '系统',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLinkPath(item: NotificationItem): string | null {
  if (!item.bizId) return null
  if (item.bizType === 'MATCH') return `/member/my-records/${item.bizId}/chat`
  if (item.bizType === 'ACTIVITY') return `/portal/activities/${item.bizId}`
  return null
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60_000)
  if (diffMin < 1)  return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24)   return `${diffH} 小时前`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7)    return `${diffD} 天前`
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

// ─── Notification Row ─────────────────────────────────────────────────────────

function NotificationRow({
  item,
  onRead,
  isLast,
}: {
  item: NotificationItem
  onRead: (id: number) => void
  isLast: boolean
}) {
  const navigate  = useNavigate()
  const linkPath  = getLinkPath(item)
  const bizConf   = item.bizType ? BIZ_CONFIG[item.bizType] : null
  const BizIcon   = bizConf?.icon ?? Bell
  const isUnread  = !item.isRead
  const clickable = !!(linkPath || isUnread)

  function handleClick() {
    if (isUnread) onRead(item.id)
    if (linkPath) navigate(linkPath)
  }

  return (
    <div
      className={clsx(
        'group relative flex items-start gap-3.5 px-4 py-3.5 transition-all duration-150',
        isUnread ? 'bg-violet-50/20 hover:bg-violet-50/40' : 'hover:bg-stone-50/60',
        !isLast && 'border-b border-stone-100/80',
        clickable && 'cursor-pointer',
      )}
      onClick={clickable ? handleClick : undefined}
      role={clickable ? 'button' : undefined}
    >
      {/* 未读左色条 */}
      {isUnread && bizConf && (
        <span className={clsx(
          'absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full',
          bizConf.leftBar,
        )} />
      )}

      {/* Icon circle */}
      <div className={clsx(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors shadow-sm',
        isUnread
          ? (bizConf?.unreadCls ?? 'bg-violet-500 text-white')
          : (bizConf?.readCls   ?? 'bg-stone-100 text-stone-400'),
      )}>
        <Icon icon={BizIcon} size={16} />
      </div>

      {/* Content */}
      <div className={clsx('flex-1 min-w-0', !isUnread && 'opacity-70')}>
        {/* 标题行 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <p className={clsx(
              'text-sm leading-snug',
              isUnread ? 'text-stone-900 font-semibold' : 'text-stone-600',
            )}>
              {item.title}
            </p>
            {/* bizType chip */}
            {bizConf && item.bizType && (
              <span className={clsx(
                'shrink-0 inline-flex items-center rounded-full border px-1.5 py-[1px] text-[10px] font-semibold leading-tight',
                bizConf.chip,
              )}>
                {BIZ_LABEL[item.bizType]}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* 未读圆点 */}
            {isUnread && (
              <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
            )}
            <span className="text-[11px] text-stone-400 font-mono tabular-nums whitespace-nowrap">
              {formatTime(item.createdAt)}
            </span>
          </div>
        </div>

        {/* 内容摘要 */}
        {item.content && (
          <p className="mt-1 text-xs text-stone-500 leading-relaxed line-clamp-2">
            {item.content}
          </p>
        )}

        {/* 跳转链接 */}
        {linkPath && (
          <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <Icon icon={ExternalLink} size={10} />
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

  const tab  = (searchParams.get('tab') ?? 'all') as TabDef['key']
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const activeBizType = TABS.find((t) => t.key === tab)?.bizType

  const { data, isLoading } = useNotifications({ page, size: PAGE_SIZE, bizType: activeBizType })
  const { data: unreadCount } = useUnreadCount()

  const markReadMutation = useMarkRead()
  const markAllMutation  = useMarkAllRead()

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

  function tabUnread(t: TabDef): number {
    if (!unreadCount) return 0
    if (t.key === 'all') return unreadCount.total
    return unreadCount[t.key as BizType] ?? 0
  }

  const hasUnread = unreadCount && (
    activeBizType ? unreadCount[activeBizType] > 0 : unreadCount.total > 0
  )

  const totalUnread = unreadCount?.total ?? 0

  return (
    <div className="flex flex-col gap-4">
      {/* ── 英雄页头 ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)' }} />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)' }} />
        <div className="relative flex items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <Icon icon={Bell} size={22} className="text-white" />
              {totalUnread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">消息中心</h1>
              <p className="mt-0.5 text-sm text-violet-100/75">
                {totalUnread > 0 ? `${totalUnread} 条未读消息` : '暂无未读消息'}
              </p>
            </div>
          </div>
          {hasUnread && (
            <button
              onClick={handleMarkAll}
              disabled={markAllMutation.isPending}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur-sm hover:bg-white/25 transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
            >
              <Icon icon={CheckCheck} size={15} />
              {activeBizType ? `全部已读（${BIZ_LABEL[activeBizType]}）` : '全部已读'}
            </button>
          )}
        </div>
      </div>

      {/* ── 分类 Tab ── */}
      <div className="rounded-xl border border-stone-100 bg-white overflow-hidden">
        <div className="flex items-center gap-0 px-2">
          {TABS.map((t) => {
            const count    = tabUnread(t)
            const isActive = tab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleTabChange(t.key)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-theme-accent text-theme-accent'
                    : 'border-transparent text-stone-500 hover:text-stone-700',
                )}
              >
                <span className={clsx('inline-block w-1.5 h-1.5 rounded-full shrink-0', t.dot)} />
                {t.label}
                {count > 0 && (
                  <span className={clsx(
                    'flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none',
                    isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-500 text-white',
                  )}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 消息列表 ── */}
      {isLoading ? (
        <div className="rounded-xl border border-stone-100 bg-white p-4">
          <SkeletonList count={6} />
        </div>
      ) : !data?.records.length ? (
        <div className="rounded-xl border border-stone-100 bg-white">
          <EmptyState
            icon={Bell}
            title="暂无消息"
            description={
              activeBizType
                ? `没有${BIZ_LABEL[activeBizType]}类消息`
                : '您还没有收到任何站内消息'
            }
          />
        </div>
      ) : (
        <div className="rounded-xl border border-stone-100 bg-white overflow-hidden">
          {data.records.map((item, idx) => (
            <NotificationRow
              key={item.id}
              item={item}
              onRead={handleRead}
              isLast={idx === data.records.length - 1}
            />
          ))}
        </div>
      )}

      {/* ── 分页 ── */}
      {data && data.total > PAGE_SIZE && (
        <div className="rounded-xl border border-stone-100 bg-white px-4 py-4">
          <Pagination
            page={page}
            total={data.total}
            size={PAGE_SIZE}
            onChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}
