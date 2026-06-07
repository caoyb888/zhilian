import { useCallback, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  AlertTriangle, Eye, FileText, Plus, PowerOff, Search, Trash2, X,
} from 'lucide-react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
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
  { label: '全部', value: -1 },
  { label: '待审核', value: 0 },
  { label: '已通过', value: 1 },
  { label: '已拒绝', value: 2 },
  { label: '已关闭', value: 3 },
]

const TYPE_OPTIONS = [
  { label: '全部类型', value: '' },
  { label: '产品需求', value: 'PRODUCT' },
  { label: '技术需求', value: 'TECHNOLOGY' },
  { label: '人才需求', value: 'TALENT' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function AuditStatusBadge({ status }: { status: number }) {
  if (status === 0) return <Badge variant="warning">待审核</Badge>
  if (status === 1) return <Badge variant="success">已通过</Badge>
  if (status === 2) return <Badge variant="error">已拒绝</Badge>
  if (status === 3) return <Badge variant="default">已关闭</Badge>
  return <Badge variant="default">未知</Badge>
}

function formatBudget(min: number | null, max: number | null) {
  if (!min && !max) return null
  if (min && max) return `${min}–${max} 万元`
  if (min) return `≥${min} 万元`
  return `≤${max} 万元`
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
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              danger ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500',
            )}>
              <Icon icon={AlertTriangle} size={20} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-stone-800">{title}</DialogTitle>
              <p className="mt-1 text-sm text-stone-500">{description}</p>
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

// ─── Demand Row ───────────────────────────────────────────────────────────────

function DemandRow({
  item,
  index,
}: {
  item: DemandItem
  index: number
}) {
  const [pendingAction, setPendingAction] = useState<'close' | 'delete' | null>(null)
  const closeMutation = useCloseDemand()
  const deleteMutation = useDeleteDemand()
  const isPending = closeMutation.isPending || deleteMutation.isPending

  const budget = formatBudget(item.budgetMin, item.budgetMax)

  function handleClose() {
    closeMutation.mutate(item.id, { onSuccess: () => setPendingAction(null) })
  }

  function handleDelete() {
    deleteMutation.mutate(item.id, { onSuccess: () => setPendingAction(null) })
  }

  return (
    <>
      <tr className="border-t border-stone-100 transition-colors hover:bg-stone-50/60">
        <td className="px-4 py-3 text-xs text-stone-400">{index}</td>
        <td className="px-4 py-3 max-w-xs">
          <p className="font-medium text-stone-800 truncate" title={item.title}>{item.title}</p>
          <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-stone-400">
            {item.summary && <span className="truncate max-w-[16rem]">{item.summary}</span>}
            {budget && <span className="shrink-0 text-emerald-600 font-medium">{budget}</span>}
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-stone-100 text-stone-600">
            {DEMAND_TYPE_LABELS[item.type] ?? item.type}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-stone-500">{item.deadline ? item.deadline.slice(0, 10) : '—'}</td>
        <td className="px-4 py-3 text-sm text-stone-500">{item.createdAt.slice(0, 10)}</td>
        <td className="px-4 py-3"><AuditStatusBadge status={item.auditStatus} /></td>
        <td className="px-4 py-3 text-right">
          <div className="inline-flex items-center gap-1 rounded-lg border border-stone-200 p-0.5">
            <Link
              to={`/supply/demands/${item.id}`}
              className="rounded p-1.5 text-stone-500 transition-all duration-200 hover:bg-stone-100 hover:text-theme-accent"
              title="查看详情"
            >
              <Icon icon={Eye} size={14} />
            </Link>
            {item.auditStatus === 1 && (
              <button
                className="rounded p-1.5 text-amber-500 transition-all duration-200 hover:bg-amber-50 hover:text-amber-600"
                title="关闭需求"
                onClick={() => setPendingAction('close')}
              >
                <Icon icon={PowerOff} size={14} />
              </button>
            )}
            <button
              className="rounded p-1.5 text-red-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
              title="删除"
              onClick={() => setPendingAction('delete')}
            >
              <Icon icon={Trash2} size={14} />
            </button>
          </div>
        </td>
      </tr>

      {pendingAction === 'close' && (
        <ConfirmModal
          title="确认关闭需求？"
          description="关闭后需求将不再对外展示，不可重新开启。"
          confirmLabel="确认关闭"
          isPending={isPending}
          onConfirm={handleClose}
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
          onConfirm={handleDelete}
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
  const type = searchParams.get('type') ?? ''
  const keyword = searchParams.get('keyword') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))

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

  const records = data?.records ?? []
  const total = data?.total ?? 0

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-theme-text-main">我的需求</h1>
          <p className="mt-0.5 text-sm text-theme-text-muted">管理我发布的所有采购与合作需求</p>
        </div>
        <Link to="/supply/demands/publish">
          <Button size="sm">
            <Icon icon={Plus} size={14} className="mr-1.5" />
            发布需求
          </Button>
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-0 border-b border-stone-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setParam({ auditStatus: tab.value === -1 ? undefined : String(tab.value), page: undefined })}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              auditStatus === tab.value
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-stone-100 bg-white p-4 shadow-card">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-stone-500">关键词</label>
          <div className="relative">
            <Icon icon={Search} size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="搜索标题"
              className="w-44 rounded-lg border border-stone-200 bg-theme-surface py-1.5 pl-9 pr-3 text-sm text-theme-text-main placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
            />
            {inputValue && (
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                onClick={() => { setInputValue(''); setParam({ keyword: undefined, page: undefined }) }}
              >
                <Icon icon={X} size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-stone-500">需求类型</label>
          <select
            value={type}
            onChange={(e) => setParam({ type: e.target.value || undefined, page: undefined })}
            className="rounded-lg border border-stone-200 bg-theme-surface px-3 py-1.5 text-sm text-theme-text-main transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
          >
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {(keyword || type) && (
          <Button variant="ghost" size="sm" onClick={handleReset}>重置</Button>
        )}
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        {isLoading ? (
          <div className="p-4"><SkeletonList count={5} /></div>
        ) : records.length === 0 ? (
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-4 py-3 w-8 text-stone-400">#</th>
                  <th className="px-4 py-3">标题</th>
                  <th className="px-4 py-3">类型</th>
                  <th className="px-4 py-3">截止日期</th>
                  <th className="px-4 py-3">发布时间</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <DemandRow key={r.id} item={r} index={(page - 1) * PAGE_SIZE + idx + 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="border-t border-stone-100 px-4 py-4">
            <Pagination
              page={page}
              total={total}
              size={PAGE_SIZE}
              onChange={(p) => setParam({ page: String(p) })}
            />
          </div>
        )}
      </div>

      {/* Tips */}
      {records.some((r) => r.auditStatus === 2) && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <span className="font-medium">已拒绝的需求：</span>
          请删除后重新发布，或联系管理员了解详情。
        </div>
      )}
    </div>
  )
}
