import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  ArrowRight, Building2, FileText, Handshake, MapPin, MessageCircle,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
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
  dot: string
  apiStatus?: number
  clientStatuses?: number[]
}

const TABS: TabDef[] = [
  { key: 'all',     label: '全部',   dot: 'bg-stone-300' },
  { key: 'pending', label: '待响应', dot: 'bg-amber-400',   apiStatus: 1 },
  { key: 'active',  label: '进行中', dot: 'bg-emerald-400', clientStatuses: [2, 3] },
  { key: 'done',    label: '已完成', dot: 'bg-emerald-600', apiStatus: 5 },
  { key: 'closed',  label: '已关闭', dot: 'bg-stone-400',   clientStatuses: [6, 7] },
]

// ─── Config Maps ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<number, { label: string; topBar: string; badge: string }> = {
  1: { label: '待响应', topBar: 'border-amber-300',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  2: { label: '已接受', topBar: 'border-sky-400',     badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  3: { label: '洽谈中', topBar: 'border-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  5: { label: '已完成', topBar: 'border-emerald-600', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  6: { label: '已拒绝', topBar: 'border-red-400',     badge: 'bg-red-50 text-red-700 border-red-200' },
  7: { label: '已撤销', topBar: 'border-stone-300',   badge: 'bg-stone-100 text-stone-600 border-stone-200' },
}

// ─── Record Card ──────────────────────────────────────────────────────────────

function RecordCard({ record }: { record: MatchRecordItem }) {
  const hasUnread    = record.unreadCount > 0
  const isSystemRec  = record.matchType === 1
  const status       = STATUS_CONFIG[record.status] ?? STATUS_CONFIG[7]
  const score        = record.matchScore !== null ? Math.round(Number(record.matchScore)) : null
  const avatarChar   = record.counterparty?.name?.charAt(0) ?? '?'

  return (
    <Link
      to={`/member/my-records/${record.recordId}`}
      state={{ record }}
      className={clsx(
        'group relative flex flex-col rounded-xl border bg-white overflow-hidden',
        'border-stone-100 border-t-2', status.topBar,
        'hover:shadow-[0_6px_24px_-6px_rgba(0,0,0,0.10)] hover:-translate-y-[1px]',
        'hover:border-stone-200/70 transition-all duration-200',
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* 状态徽标 */}
          <span className={clsx(
            'inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-semibold border shrink-0',
            status.badge,
          )}>
            {status.label}
          </span>
          {/* 申请方式 — 系统推荐 vs 主动申请分色 */}
          <span className={clsx(
            'inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-semibold border shrink-0',
            isSystemRec
              ? 'bg-violet-50 text-violet-600 border-violet-200'
              : 'bg-sky-50 text-sky-600 border-sky-200',
          )}>
            {isSystemRec ? '系统推荐' : '主动申请'}
          </span>
          {!record.isInitiator && (
            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-[2px] text-[10px] font-semibold text-amber-600 shrink-0">
              收到申请
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasUnread && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-[3px] text-[10px] font-bold text-white shadow-sm shadow-red-200">
              <Icon icon={MessageCircle} size={9} />
              {record.unreadCount}
            </span>
          )}
          <span className="text-[11px] text-stone-400 font-mono tabular-nums">
            {record.createdAt.slice(0, 10)}
          </span>
        </div>
      </div>

      {/* ── Counterparty ── */}
      {record.counterparty ? (
        <div className="flex items-center gap-2.5 px-4 pb-3">
          {/* 升级头像：渐变底色 + 白色首字 + 状态 ring */}
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[13px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm select-none">
              {avatarChar}
            </div>
            {hasUnread && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-1 ring-white" />
            )}
          </div>
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="text-sm font-semibold text-stone-900 truncate">
              {record.counterparty.name}
            </span>
            {record.counterparty.province && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-stone-400 shrink-0">
                <Icon icon={MapPin} size={10} />
                {record.counterparty.province}
              </span>
            )}
            {record.counterparty.memberLevel === 2 && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 shrink-0">VIP</span>
            )}
            {record.counterparty.memberLevel === 3 && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 shrink-0">理事</span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 px-4 pb-3">
          <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
            <Icon icon={Building2} size={14} className="text-stone-400" />
          </div>
          <span className="text-sm text-stone-400 italic">对方信息不可见</span>
        </div>
      )}

      {/* ── Resource ↔ Demand pair ── */}
      <div className="px-4 pb-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-[2px] text-[10px] font-semibold text-emerald-700 leading-tight">资源</span>
          <p className="text-xs text-stone-700 line-clamp-1 leading-snug min-w-0 pt-0.5">
            {record.resourceTitle ?? <span className="italic text-stone-400">资源已下架</span>}
          </p>
        </div>
        {/* 渐变连接线：emerald → blue */}
        <div className="ml-[11px] my-1 w-px h-3 rounded-full" style={{ background: 'linear-gradient(to bottom, #6ee7b7, #93c5fd)' }} />
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 rounded-full bg-blue-50 border border-blue-200 px-2 py-[2px] text-[10px] font-semibold text-blue-700 leading-tight">需求</span>
          <p className="text-xs text-stone-700 line-clamp-1 leading-snug min-w-0 pt-0.5">
            {record.demandTitle ?? <span className="italic text-stone-400">需求已关闭</span>}
          </p>
        </div>
      </div>

      {/* ── Apply message ── */}
      {record.applyMessage && (
        <div className="mx-4 mb-3 rounded-xl bg-stone-50 border border-stone-100 px-3 py-2.5 text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
          <span className="text-stone-300 mr-1 font-serif text-base leading-none not-italic">"</span>
          {record.applyMessage}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="mt-auto flex items-center justify-between border-t border-stone-100 px-4 py-3">
        {score !== null ? (
          <div className="flex items-center gap-2.5">
            <div className="w-14 h-1.5 rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(score, 100)}%`,
                  background: 'linear-gradient(to right, #34d399, #2dd4bf)',
                }}
              />
            </div>
            <span className="text-[11px] font-bold tabular-nums text-emerald-600">{score}<span className="font-normal text-stone-400 ml-0.5">分</span></span>
          </div>
        ) : (
          <span />
        )}
        {/* ghost → solid hover */}
        <span className={clsx(
          'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 shrink-0',
          'border border-emerald-200 bg-emerald-50 text-emerald-600',
          'group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-white',
        )}>
          查看详情
          <Icon icon={ArrowRight} size={11} className="transition-transform duration-150 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
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
      {/* ── 英雄页头 ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f4c75 0%, #0d9488 100%)' }} />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #67e8f9, transparent)' }} />
        <div className="relative flex items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <Icon icon={Handshake} size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">我的对接记录</h1>
              <p className="mt-0.5 text-sm text-cyan-100/75">
                {total > 0 ? `共 ${total} 条对接` : '发起或接收的供需对接申请'}
              </p>
            </div>
          </div>
          <Link
            to="/supply/recommend"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur-sm hover:bg-white/25 transition-all duration-150 active:scale-[0.97]"
          >
            <Icon icon={FileText} size={15} />
            去发现匹配
          </Link>
        </div>
      </div>

      {/* ── 状态 Tab ── */}
      <div className="rounded-xl border border-stone-100 bg-white overflow-hidden">
        <div className="flex items-center gap-0 px-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setParam({ tab: t.key === 'all' ? undefined : t.key, page: undefined })}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                tab === t.key
                  ? 'border-theme-accent text-theme-accent'
                  : 'border-transparent text-stone-500 hover:text-stone-700',
              )}
            >
              <span className={clsx('inline-block w-1.5 h-1.5 rounded-full shrink-0', t.dot)} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Combined-tab notice ── */}
      {isCombinedTab && (
        <p className="text-xs text-stone-400">
          显示最近 50 条记录中符合该状态的数据；如需查看全部，请切换至「全部」标签。
        </p>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="rounded-xl border border-stone-100 bg-white p-4">
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {records.map((r) => (
              <RecordCard key={r.recordId} record={r} />
            ))}
          </div>

          {!isCombinedTab && pages > 1 && (
            <div className="rounded-xl border border-stone-100 bg-white px-4 py-4">
              <Pagination
                page={page}
                total={total}
                size={PAGE_SIZE}
                onChange={(p) => setParam({ page: String(p) })}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
