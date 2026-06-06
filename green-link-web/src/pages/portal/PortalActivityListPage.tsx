import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapPin, Calendar, CalendarDays, Clock } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { SkeletonCard } from '@/components/states/SkeletonCard'
import { PortalNav } from '@/business/PortalNav'
import { Pagination } from '@/components/Pagination'
import { usePublicActivityList, ACTIVITY_STATUS_MAP } from '@/services/activityService'
import type { Activity } from '@/services/activityService'

const PAGE_SIZE = 12

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(s: string | null) {
  return s ? s.slice(0, 10) : ''
}

function formatDateTime(s: string | null) {
  return s ? s.slice(0, 16).replace('T', ' ') : ''
}

// ─── Activity Card ────────────────────────────────────────────────────────────

function ActivityCard({ activity }: { activity: Activity }) {
  const statusMeta = ACTIVITY_STATUS_MAP[activity.status] ?? {
    label: '未知',
    color: 'bg-gray-100 text-gray-500',
  }
  const isFull =
    activity.maxCapacity !== null && activity.regCount >= activity.maxCapacity
  const pct =
    activity.maxCapacity
      ? Math.min(100, Math.round((activity.regCount / activity.maxCapacity) * 100))
      : null

  return (
    <Link
      to={`/portal/activities/${activity.id}`}
      className="group flex flex-col rounded-xl border border-stone-100 bg-white shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Cover */}
      <div className="aspect-[16/10] bg-gradient-to-br from-emerald-50 to-teal-100 overflow-hidden flex-shrink-0">
        {activity.coverUrl ? (
          <img
            src={activity.coverUrl}
            alt={activity.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-teal-200 select-none">
            <Icon icon={CalendarDays} size={40} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`rounded text-xs font-medium px-1.5 py-0.5 ${statusMeta.color}`}>
            {statusMeta.label}
          </span>
          {isFull && activity.status === 2 && (
            <span className="rounded text-xs font-medium px-1.5 py-0.5 bg-red-100 text-red-600">
              名额已满
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 group-hover:text-theme-accent transition-colors duration-200 flex-1">
          {activity.title}
        </h3>

        <div className="mt-2 space-y-1 text-xs text-stone-500">
          {activity.location && (
            <div className="flex items-center gap-1.5 truncate">
              <Icon icon={MapPin} size={16} className="flex-shrink-0 text-stone-400" />
              <span className="truncate">{activity.location}</span>
            </div>
          )}
          {activity.startTime && (
            <div className="flex items-center gap-1.5">
              <Icon icon={Calendar} size={16} className="flex-shrink-0 text-stone-400" />
              <span>
                {formatDate(activity.startTime)}
                {activity.endTime && ` — ${formatDate(activity.endTime)}`}
              </span>
            </div>
          )}
          {activity.regDeadline && activity.status === 2 && (
            <div className="flex items-center gap-1.5">
              <Icon icon={Clock} size={16} className="flex-shrink-0 text-stone-400" />
              <span>报名截止 {formatDateTime(activity.regDeadline)}</span>
            </div>
          )}
        </div>

        {/* Capacity bar */}
        {activity.maxCapacity && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-stone-400 mb-1">
              <span>报名人数</span>
              <span>
                {activity.regCount} / {activity.maxCapacity}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull ? 'bg-red-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}

// ─── Status Tabs ──────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { label: '全部', value: undefined },
  { label: '报名中', value: 2 },
  { label: '已结束', value: 3 },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PortalActivityListPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const statusParam = searchParams.get('status')
  const status = statusParam ? Number(statusParam) : undefined
  const page = Number(searchParams.get('page')) || 1

  const setParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(updates).forEach(([k, v]) => {
            if (v === undefined) next.delete(k)
            else next.set(k, v)
          })
          return next
        },
        { replace: false },
      )
    },
    [setSearchParams],
  )

  function handleStatusChange(s: number | undefined) {
    setParam({ status: s?.toString(), page: undefined })
  }

  function handlePageChange(p: number) {
    setParam({ page: String(p) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const { data, isLoading, isFetching, isError } = usePublicActivityList({ status, page, size: PAGE_SIZE })
  const activities = data?.records ?? []
  const total = data?.total ?? 0

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg">
      <PortalNav />

      {/* Page header */}
      <div className="bg-theme-surface border-b border-theme-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-theme-text-main">近期活动</h1>
          <p className="mt-1 text-sm text-theme-text-muted">绿色产业交流会议 · 对接展览 · 专题培训</p>
        </div>

        {/* Status tabs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {STATUS_TABS.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => handleStatusChange(value)}
                className={[
                  'px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200',
                  status === value
                    ? 'border-theme-accent text-theme-accent'
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div
          className={[
            'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity duration-200',
            isFetching && !isLoading ? 'opacity-60' : '',
          ].join(' ')}
        >
          {isLoading ? (
            Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
          ) : isError ? (
            <div className="col-span-full">
              <ErrorState
                title="加载失败"
                description="活动列表加载异常，请检查网络或稍后重试"
                action={
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-lg bg-theme-accent px-4 py-2 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200"
                  >
                    刷新页面
                  </button>
                }
              />
            </div>
          ) : activities.length > 0 ? (
            activities.map((a) => <ActivityCard key={a.id} activity={a} />)
          ) : (
            <div className="col-span-full">
              <EmptyState
                icon={CalendarDays}
                title="暂无活动"
                description="当前条件下暂无活动，敬请关注后续更新"
              />
            </div>
          )}
        </div>

        {total > PAGE_SIZE && (
          <div className="mt-8">
            <Pagination page={page} total={total} size={PAGE_SIZE} onChange={handlePageChange} />
          </div>
        )}
      </main>

      <footer className="bg-stone-900 text-stone-400 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs">
          © 2024 山东省绿色低碳产业协会 · 绿产智链平台
        </div>
      </footer>
    </div>
  )
}
