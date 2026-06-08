import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  ArrowRight, Building2, FileText, Handshake, MapPin, MessageCircle,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Badge } from '@/components/Badge'
import { Pagination } from '@/components/Pagination'
import { EmptyState } from '@/components/states/EmptyState'
import { SkeletonList } from '@/components/states/SkeletonList'
import { useMyMatchRecords, type MatchRecordItem } from '@/services/matchService'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

type TabKey = 'all' | 'pending' | 'active' | 'done' | 'closed'

interface TabDef {
  key: TabKey
  label: string
  apiStatus?: number
  clientStatuses?: number[]
}

// "active" (2,3) and "closed" (6,7) are combined groups: fetch without status
// filter and apply client-side filtering (acceptable for one user's record count).
const TABS: TabDef[] = [
  { key: 'all',     label: '全部' },
  { key: 'pending', label: '待响应', apiStatus: 1 },
  { key: 'active',  label: '进行中', clientStatuses: [2, 3] },
  { key: 'done',    label: '已完成', apiStatus: 5 },
  { key: 'closed',  label: '已关闭', clientStatuses: [6, 7] },
]

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_META: Record<number, { label: string; variant: 'warning' | 'news' | 'success' | 'error' | 'default' }> = {
  1: { label: '待响应', variant: 'warning' },
  2: { label: '已接受', variant: 'news' },
  3: { label: '洽谈中', variant: 'success' },
  5: { label: '已完成', variant: 'success' },
  6: { label: '已拒绝', variant: 'error' },
  7: { label: '已撤销', variant: 'default' },
}

function StatusBadge({ status }: { status: number }) {
  const meta = STATUS_META[status] ?? { label: String(status), variant: 'default' as const }
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

// ─── Record card ──────────────────────────────────────────────────────────────

function RecordCard({ record }: { record: MatchRecordItem }) {
  const hasUnread = record.unreadCount > 0
  const matchTypelabel = record.matchType === 1 ? '系统推荐' : '主动申请'

  return (
    <div className="group flex flex-col rounded-xl border border-stone-100 bg-white shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={record.status} />
          <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
            {matchTypelabel}
          </span>
          {!record.isInitiator && (
            <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">
              收到申请
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasUnread && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              <Icon icon={MessageCircle} size={10} />
              {record.unreadCount}
            </span>
          )}
          <span className="text-xs text-stone-400">{record.createdAt.slice(0, 10)}</span>
        </div>
      </div>

      {/* Counterparty */}
      {record.counterparty && (
        <div className="flex items-center gap-1.5 px-5 pb-2 text-sm text-stone-600">
          <Icon icon={Building2} size={14} className="text-stone-400 flex-shrink-0" />
          <span className="font-medium truncate">{record.counterparty.name}</span>
          {record.counterparty.province && (
            <span className="flex items-center gap-0.5 text-xs text-stone-400 flex-shrink-0">
              <Icon icon={MapPin} size={11} />
              {record.counterparty.province}
            </span>
          )}
          {record.counterparty.memberLevel === 2 && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1">VIP</span>
          )}
          {record.counterparty.memberLevel === 3 && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1">理事</span>
          )}
        </div>
      )}

      {/* Titles */}
      <div className="px-5 pb-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex-shrink-0 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 leading-tight">资源</span>
          <p className="text-sm text-stone-800 line-clamp-1 leading-snug">
            {record.resourceTitle ?? '（资源已下架）'}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex-shrink-0 rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 leading-tight">需求</span>
          <p className="text-sm text-stone-800 line-clamp-1 leading-snug">
            {record.demandTitle ?? '（需求已关闭）'}
          </p>
        </div>
      </div>

      {/* Apply message preview */}
      {record.applyMessage && (
        <div className="mx-5 mb-3 rounded-lg bg-stone-50 border border-stone-100 px-3 py-2 text-xs text-stone-500 italic line-clamp-2">
          "{record.applyMessage}"
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3">
        {record.matchScore !== null ? (
          <span className="text-xs text-stone-400">
            匹配度 <span className="font-semibold text-emerald-600">{Math.round(Number(record.matchScore))} 分</span>
          </span>
        ) : (
          <span />
        )}
        <Link
          to={`/member/my-records/${record.recordId}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          查看详情
          <Icon icon={ArrowRight} size={12} />
        </Link>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyMatchRecordsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = (searchParams.get('tab') ?? 'all') as TabKey
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))

  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0]
  const isCombinedTab = activeTab.clientStatuses !== undefined

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
        { replace: true },
      )
    },
    [setSearchParams],
  )

  // For combined tabs (active/closed), fetch a large batch and filter client-side.
  // For single-status tabs, use normal server-side paginated fetch.
  const { data, isLoading } = useMyMatchRecords(
    isCombinedTab
      ? { page: 1, size: 50, status: undefined }
      : { page, size: PAGE_SIZE, status: activeTab.apiStatus },
  )

  const rawRecords = data?.records ?? []
  const records = isCombinedTab && activeTab.clientStatuses
    ? rawRecords.filter((r) => activeTab.clientStatuses!.includes(r.status))
    : rawRecords

  const total = isCombinedTab ? records.length : (data?.total ?? 0)
  const pages = isCombinedTab ? 1 : (data?.pages ?? 1)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-theme-text-main">我的对接记录</h1>
        <p className="mt-0.5 text-sm text-theme-text-muted">查看所有供需对接的进展与状态</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-0 border-b border-stone-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setParam({ tab: t.key === 'all' ? undefined : t.key, page: undefined })}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === t.key
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Combined-tab notice */}
      {isCombinedTab && (
        <p className="text-xs text-stone-400">
          显示最近 50 条记录中符合该状态的数据；如需查看全部，请切换至「全部」标签。
        </p>
      )}

      {/* List */}
      {isLoading ? (
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <SkeletonList count={4} />
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="暂无对接记录"
          description={tab === 'all' ? '您还没有发起或收到任何对接申请' : '当前状态下没有对接记录'}
          action={
            tab === 'all'
              ? (
                <Link
                  to="/supply/recommend"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
                >
                  <Icon icon={FileText} size={14} />
                  去发现匹配
                </Link>
              )
              : undefined
          }
        />
      ) : (
        <>
          <div className="text-xs text-stone-400">
            共 <span className="font-semibold text-stone-600">{total}</span> 条记录
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {records.map((r) => (
              <RecordCard key={r.recordId} record={r} />
            ))}
          </div>

          {!isCombinedTab && pages > 1 && (
            <Pagination
              page={page}
              total={total}
              size={PAGE_SIZE}
              onChange={(p) => setParam({ page: String(p) })}
            />
          )}
        </>
      )}
    </div>
  )
}
