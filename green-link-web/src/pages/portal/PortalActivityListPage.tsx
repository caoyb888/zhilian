import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
      className="group flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-200 overflow-hidden"
    >
      {/* Cover */}
      <div className="h-44 bg-gradient-to-br from-emerald-50 to-teal-100 overflow-hidden flex-shrink-0">
        {activity.coverUrl ? (
          <img
            src={activity.coverUrl}
            alt={activity.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-teal-200 text-5xl select-none">
            ♻
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`rounded text-xs font-medium px-1.5 py-0.5 ${statusMeta.color}`}>
            {statusMeta.label}
          </span>
          {isFull && activity.status === 2 && (
            <span className="rounded text-xs font-medium px-1.5 py-0.5 bg-red-100 text-red-600">
              名额已满
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-600 transition-colors flex-1">
          {activity.title}
        </h3>

        <div className="mt-2 space-y-1 text-xs text-gray-500">
          {activity.location && (
            <div className="flex items-center gap-1.5 truncate">
              <span className="flex-shrink-0">📍</span>
              <span className="truncate">{activity.location}</span>
            </div>
          )}
          {activity.startTime && (
            <div className="flex items-center gap-1.5">
              <span className="flex-shrink-0">🗓</span>
              <span>
                {formatDate(activity.startTime)}
                {activity.endTime && ` — ${formatDate(activity.endTime)}`}
              </span>
            </div>
          )}
          {activity.regDeadline && activity.status === 2 && (
            <div className="flex items-center gap-1.5">
              <span className="flex-shrink-0">⏰</span>
              <span>报名截止 {formatDateTime(activity.regDeadline)}</span>
            </div>
          )}
        </div>

        {/* Capacity bar */}
        {activity.maxCapacity && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>报名人数</span>
              <span>
                {activity.regCount} / {activity.maxCapacity}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isFull ? 'bg-red-400' : 'bg-brand-500'
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonGrid({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-100 bg-white overflow-hidden animate-pulse"
        >
          <div className="h-44 bg-gray-100" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-12 bg-gray-100 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-3 w-3/4 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </>
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

  const { data, isLoading, isFetching } = usePublicActivityList({ status, page, size: PAGE_SIZE })
  const activities = data?.records ?? []
  const total = data?.total ?? 0

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PortalNav />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900">近期活动</h1>
          <p className="mt-1 text-sm text-gray-500">绿色产业交流会议 · 对接展览 · 专题培训</p>
        </div>

        {/* Status tabs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {STATUS_TABS.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => handleStatusChange(value)}
                className={[
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  status === value
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
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
            <SkeletonGrid count={PAGE_SIZE} />
          ) : activities.length > 0 ? (
            activities.map((a) => <ActivityCard key={a.id} activity={a} />)
          ) : (
            <div className="col-span-3 py-24 text-center text-gray-400 text-sm">
              暂无活动
            </div>
          )}
        </div>

        {total > PAGE_SIZE && (
          <div className="mt-8">
            <Pagination page={page} total={total} size={PAGE_SIZE} onChange={handlePageChange} />
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-gray-400 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs">
          © 2024 山东省绿色低碳产业协会 · 绿产智链平台
        </div>
      </footer>
    </div>
  )
}
