import { useCallback, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  AlertTriangle, Banknote, Calendar, CalendarClock, CalendarX,
  Eye, FileText, Lightbulb, MapPin, Plus, PowerOff,
  Search, ShoppingCart, Trash2, Users, X,
} from 'lucide-react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/Button'
import { Pagination } from '@/components/Pagination'
import { EmptyState } from '@/components/states/EmptyState'
import { SkeletonList } from '@/components/states/SkeletonList'
import {
  useMyDemands,
  useCloseDemand,
  useDeleteDemand,
  DEMAND_TYPE_LABELS,
  type DemandItem,
} from '@/services/supplyService'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15

const STATUS_TABS = [
  { label: '全部',   value: -1, dot: 'bg-stone-300' },
  { label: '待审核', value:  0, dot: 'bg-amber-400' },
  { label: '已通过', value:  1, dot: 'bg-emerald-500' },
  { label: '已拒绝', value:  2, dot: 'bg-red-400' },
  { label: '已关闭', value:  3, dot: 'bg-stone-400' },
]

const TYPE_OPTIONS = [
  { label: '全部类型', value: '' },
  { label: '产品需求', value: 'PRODUCT' },
  { label: '技术需求', value: 'TECHNOLOGY' },
  { label: '人才需求', value: 'TALENT' },
]

// ─── Config Maps ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<number, { label: string; bar: string; badge: string }> = {
  0: { label: '待审核', bar: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  1: { label: '已通过', bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  2: { label: '已拒绝', bar: 'bg-red-400',     badge: 'bg-red-50 text-red-700 border-red-200' },
  3: { label: '已关闭', bar: 'bg-stone-300',   badge: 'bg-stone-100 text-stone-600 border-stone-200' },
}

const TYPE_CONFIG: Record<string, { icon: typeof ShoppingCart; chip: string }> = {
  PRODUCT:    { icon: ShoppingCart, chip: 'bg-blue-50 text-blue-700 border-blue-200' },
  TECHNOLOGY: { icon: Lightbulb,   chip: 'bg-violet-50 text-violet-700 border-violet-200' },
  TALENT:     { icon: Users,       chip: 'bg-orange-50 text-orange-700 border-orange-200' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBudget(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  if (min && max) return `¥ ${min}–${max} 万元`
  if (min) return `≥${min} 万元`
  return `≤${max} 万元`
}

function getDeadlineConfig(deadline: string | null): {
  text: string
  icon: typeof Calendar
  cls: string
} | null {
  if (!deadline) return null
  const now = new Date()
  const due = new Date(deadline)
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const dateStr = deadline.slice(0, 10)

  if (diffDays < 0)  return { text: `截止 ${dateStr}`, icon: CalendarX,     cls: 'text-red-500' }
  if (diffDays <= 7) return { text: `截止 ${dateStr}`, icon: CalendarClock,  cls: 'text-amber-500' }
  return               { text: `截止 ${dateStr}`, icon: Calendar,       cls: 'text-stone-400' }
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  description,
  confirmLabel,
  danger,
  isPending,
  onConfirm,
  onClose,
}: {
  title: string
  description: string
  confirmLabel: string
  danger?: boolean
  isPending: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className={clsx(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              danger ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500',
            )}>
              <Icon icon={AlertTriangle} size={20} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-stone-800">{title}</DialogTitle>
              <p className="mt-1 text-sm text-stone-500 leading-relaxed">{description}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>取消</Button>
            <Button
              variant={danger ? 'danger' : 'primary'}
              size="sm"
              type="button"
              loading={isPending}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ─── Demand Card ──────────────────────────────────────────────────────────────

function DemandCard({ item, index }: { item: DemandItem; index: number }) {
  const [pendingAction, setPendingAction] = useState<'close' | 'delete' | null>(null)
  const closeMutation  = useCloseDemand()
  const deleteMutation = useDeleteDemand()
  const isPending = closeMutation.isPending || deleteMutation.isPending

  const status      = STATUS_CONFIG[item.auditStatus] ?? STATUS_CONFIG[3]
  const typeConf    = TYPE_CONFIG[item.type]
  const TypeIcon    = typeConf?.icon ?? ShoppingCart
  const budget      = formatBudget(item.budgetMin, item.budgetMax)
  const deadlineConf = getDeadlineConfig(item.deadline)

  return (
    <>
      <div className={clsx(
        'group relative flex items-stretch gap-0 rounded-xl border bg-white transition-all duration-200',
        'hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]',
        item.auditStatus === 2 ? 'border-red-100' : 'border-stone-100',
      )}>
        {/* 左侧状态色条 */}
        <div className={clsx('w-1 flex-shrink-0 rounded-l-xl transition-all duration-200 group-hover:w-[5px]', status.bar)} />

        {/* 主内容 */}
        <div className="flex flex-1 items-center gap-4 px-4 py-3.5 min-w-0">
          {/* 序号 */}
          <span className="hidden sm:block text-[11px] font-mono text-stone-300 w-5 shrink-0 text-center">
            {String(index).padStart(2, '0')}
          </span>

          {/* 标题 + 摘要 + 标签行 */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-stone-800 truncate leading-snug" title={item.title}>
              {item.title}
            </p>
            {item.summary && (
              <p className="text-xs text-stone-400 truncate mt-0.5 leading-relaxed">{item.summary}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {typeConf && (
                <span className={clsx(
                  'inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[11px] font-medium border',
                  typeConf.chip,
                )}>
                  <Icon icon={TypeIcon} size={10} />
                  {DEMAND_TYPE_LABELS[item.type] ?? item.type}
                </span>
              )}
              {budget && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <Icon icon={Banknote} size={10} />
                  {budget}
                </span>
              )}
              {deadlineConf && (
                <span className={clsx('inline-flex items-center gap-1 text-[11px]', deadlineConf.cls)}>
                  <Icon icon={deadlineConf.icon} size={10} />
                  {deadlineConf.text}
                </span>
              )}
              {item.province && (
                <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                  <Icon icon={MapPin} size={10} />
                  {item.province}
                </span>
              )}
              {item.tags?.slice(0, 3).map((t) => (
                <span key={t.id} className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-[1px] rounded-full">
                  {t.name}
                </span>
              ))}
            </div>
          </div>

          {/* 右侧信息 + 操作（桌面端） */}
          <div className="hidden md:flex items-start gap-4 shrink-0">
            <div className="flex flex-col items-end gap-1 text-right">
              <span className={clsx(
                'inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[11px] font-semibold border',
                status.badge,
              )}>
                {status.label}
              </span>
              <span className="text-[11px] text-stone-400 font-mono">
                {item.createdAt.slice(0, 10)}
              </span>
              {item.viewCount > 0 && (
                <span className="text-[11px] text-stone-300">{item.viewCount} 次浏览</span>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 min-w-[88px]">
              <Link
                to={`/supply/demands/${item.id}`}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-theme-accent transition-colors"
                title="查看详情"
              >
                <Icon icon={Eye} size={15} />
              </Link>
              {item.auditStatus === 1 && (
                <button
                  className="rounded-lg p-1.5 text-stone-400 hover:bg-amber-50 hover:text-amber-500 transition-colors"
                  title="关闭需求"
                  onClick={() => setPendingAction('close')}
                >
                  <Icon icon={PowerOff} size={15} />
                </button>
              )}
              <button
                className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="删除"
                onClick={() => setPendingAction('delete')}
              >
                <Icon icon={Trash2} size={15} />
              </button>
            </div>
          </div>

          {/* 移动端状态徽章 */}
          <span className={clsx(
            'md:hidden inline-flex items-center px-2 py-[2px] rounded-full text-[11px] font-semibold border shrink-0',
            status.badge,
          )}>
            {status.label}
          </span>
        </div>
      </div>

      {pendingAction === 'close' && (
        <ConfirmModal
          title="确认关闭需求？"
          description="关闭后需求将不再对外展示，不可重新开启。"
          confirmLabel="确认关闭"
          isPending={isPending}
          onConfirm={() => closeMutation.mutate(item.id, { onSuccess: () => setPendingAction(null) })}
          onClose={() => setPendingAction(null)}
        />
      )}
      {pendingAction === 'delete' && (
        <ConfirmModal
          title="确认删除需求？"
          description="删除后数据将无法恢复，请谨慎操作。"
          confirmLabel="确认删除"
          danger
          isPending={isPending}
          onConfirm={() => deleteMutation.mutate(item.id, { onSuccess: () => setPendingAction(null) })}
          onClose={() => setPendingAction(null)}
        />
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyDemandsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const auditStatus = Number(searchParams.get('auditStatus') ?? -1)
  const type        = searchParams.get('type') ?? ''
  const keyword     = searchParams.get('keyword') ?? ''
  const page        = Math.max(1, Number(searchParams.get('page') ?? 1))

  const [inputValue, setInputValue] = useState(keyword)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const { data, isLoading } = useMyDemands({
    page,
    size: PAGE_SIZE,
    auditStatus: auditStatus >= 0 ? auditStatus : undefined,
    type: type || undefined,
  })

  const records    = data?.records ?? []
  const total      = data?.total ?? 0
  const hasRejected = records.some((r) => r.auditStatus === 2)

  function handleSearchInput(v: string) {
    setInputValue(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setParam({ keyword: v || undefined, page: undefined })
    }, 500)
  }

  function handleReset() {
    setInputValue('')
    setSearchParams({ auditStatus: String(auditStatus) }, { replace: true })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── 英雄页头 ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #312e81 0%, #1d4ed8 100%)' }} />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #93c5fd, transparent)' }} />
        <div className="relative flex items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <Icon icon={FileText} size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">我的需求</h1>
              <p className="mt-0.5 text-sm text-blue-100/75">
                {total > 0 ? `共 ${total} 条需求` : '管理已发布的采购需求'}
              </p>
            </div>
          </div>
          <Link to="/supply/demands/publish">
            <button className="flex shrink-0 items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur-sm hover:bg-white/25 transition-all duration-150 active:scale-[0.97]">
              <Icon icon={Plus} size={15} />
              发布需求
            </button>
          </Link>
        </div>
      </div>

      {/* ── 状态 Tab + 筛选 ── */}
      <div className="rounded-xl border border-stone-100 bg-white overflow-hidden">
        {/* Tab 行 */}
        <div className="flex items-center gap-0 border-b border-stone-100 px-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setParam({ auditStatus: tab.value === -1 ? undefined : String(tab.value), page: undefined })}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                auditStatus === tab.value
                  ? 'border-theme-accent text-theme-accent'
                  : 'border-transparent text-stone-500 hover:text-stone-700',
              )}
            >
              <span className={clsx('inline-block w-1.5 h-1.5 rounded-full', tab.dot)} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 筛选行 */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-stone-50/50">
          <div className="relative">
            <Icon icon={Search} size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="搜索标题…"
              className="w-40 rounded-lg border border-stone-200 bg-white py-1.5 pl-8 pr-7 text-sm text-theme-text-main placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
            />
            {inputValue && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                onClick={() => { setInputValue(''); setParam({ keyword: undefined, page: undefined }) }}
              >
                <Icon icon={X} size={12} />
              </button>
            )}
          </div>

          <select
            value={type}
            onChange={(e) => setParam({ type: e.target.value || undefined, page: undefined })}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-theme-text-main transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
          >
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {(keyword || type) && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1 transition-colors"
            >
              <Icon icon={X} size={12} />
              重置
            </button>
          )}
        </div>
      </div>

      {/* ── 需求列表 ── */}
      {isLoading ? (
        <div className="rounded-xl border border-stone-100 bg-white p-4">
          <SkeletonList count={5} />
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-xl border border-stone-100 bg-white">
          <EmptyState
            icon={FileText}
            title="暂无需求"
            description={auditStatus >= 0 ? '当前状态下没有需求记录' : '您还没有发布任何需求，立即发布第一条！'}
            action={
              auditStatus < 0
                ? <Link to="/supply/demands/publish"><Button size="sm"><Icon icon={Plus} size={14} className="mr-1" />发布需求</Button></Link>
                : undefined
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {records.map((r, idx) => (
            <DemandCard key={r.id} item={r} index={(page - 1) * PAGE_SIZE + idx + 1} />
          ))}
        </div>
      )}

      {/* ── 分页 ── */}
      {total > PAGE_SIZE && (
        <div className="rounded-xl border border-stone-100 bg-white px-4 py-4">
          <Pagination
            page={page}
            total={total}
            size={PAGE_SIZE}
            onChange={(p) => setParam({ page: String(p) })}
          />
        </div>
      )}

      {/* ── 已拒绝提示 ── */}
      {hasRejected && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <Icon icon={AlertTriangle} size={15} className="mt-0.5 shrink-0 text-amber-500" />
          <p><span className="font-semibold">已拒绝的需求：</span>请删除后重新发布，或联系管理员了解详情。</p>
        </div>
      )}
    </div>
  )
}
