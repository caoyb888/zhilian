import { useCallback, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { clsx } from 'clsx'
import {
  Check, CheckCircle2, Eye, FileText, Search, X, XCircle,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Pagination } from '@/components/Pagination'
import { EmptyState } from '@/components/states/EmptyState'
import { SkeletonList } from '@/components/states/SkeletonList'
import { FormField } from '@/components/FormField'
import {
  useAdminResourceList,
  useAdminDemandList,
  useAuditResource,
  useAuditDemand,
  type AdminResourceVO,
  type AdminDemandVO,
} from '@/services/supplyAdminService'
import {
  RESOURCE_TYPE_LABELS,
  DEMAND_TYPE_LABELS,
} from '@/services/supplyService'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const AUDIT_STATUS_OPTIONS = [
  { label: '全部状态', value: -1 },
  { label: '待审核', value: 0 },
  { label: '已通过', value: 1 },
  { label: '已拒绝', value: 2 },
  { label: '已下架/关闭', value: 3 },
]

const RESOURCE_TYPE_OPTIONS = [
  { label: '全部类型', value: '' },
  { label: '产品/物资', value: 'PRODUCT' },
  { label: '技术/专利', value: 'TECHNOLOGY' },
  { label: '人才/团队', value: 'TALENT' },
]

const DEMAND_TYPE_OPTIONS = [
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
  if (status === 3) return <Badge variant="default">已下架</Badge>
  return <Badge variant="default">未知</Badge>
}

function TypeBadge({ type, isResource }: { type: string; isResource: boolean }) {
  const label = isResource
    ? (RESOURCE_TYPE_LABELS[type] ?? type)
    : (DEMAND_TYPE_LABELS[type] ?? type)
  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-slate-700/60 text-slate-300">
      {label}
    </span>
  )
}

// ─── Audit Modal ──────────────────────────────────────────────────────────────

type AuditItem = AdminResourceVO | AdminDemandVO

interface AuditFormData {
  action: 'APPROVE' | 'REJECT'
  remark: string
}

function AuditModal({
  item,
  isResource,
  onClose,
}: {
  item: AuditItem
  isResource: boolean
  onClose: () => void
}) {
  const resourceMutation = useAuditResource()
  const demandMutation = useAuditDemand()
  const mutation = isResource ? resourceMutation : demandMutation

  const { register, handleSubmit, watch, formState: { errors } } = useForm<AuditFormData>({
    defaultValues: { action: 'APPROVE', remark: '' },
  })

  const action = watch('action')

  function onSubmit(data: AuditFormData) {
    mutation.mutate(
      { id: item.id, action: data.action, remark: data.remark.trim() || undefined },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-slate-800/60 px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-100">
              审核{isResource ? '资源' : '需求'}
            </DialogTitle>
            <button
              className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-700/60 hover:text-slate-200"
              onClick={onClose}
              aria-label="关闭"
            >
              <Icon icon={X} size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5">
            {/* Item info preview */}
            <div className="mb-5 rounded-lg bg-slate-800/40 p-4">
              <p className="text-sm font-medium text-slate-100 line-clamp-2">{item.title}</p>
              <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-400">
                <span>类型：{isResource ? (RESOURCE_TYPE_LABELS[item.type] ?? item.type) : (DEMAND_TYPE_LABELS[item.type] ?? item.type)}</span>
                <span>提交时间：{item.createdAt.slice(0, 10)}</span>
              </div>
              {item.summary && (
                <p className="mt-2 text-xs text-slate-400 line-clamp-2">{item.summary}</p>
              )}
            </div>

            {/* Action */}
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-slate-300">审核结果</p>
              <div className="flex gap-4">
                <label className={clsx(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all duration-200',
                  action === 'APPROVE'
                    ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-400'
                    : 'border-slate-700/60 text-slate-400 hover:border-slate-600',
                )}>
                  <input type="radio" value="APPROVE" {...register('action')} className="accent-emerald-500" />
                  <Icon icon={Check} size={16} />
                  通过
                </label>
                <label className={clsx(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all duration-200',
                  action === 'REJECT'
                    ? 'border-red-500/60 bg-red-950/40 text-red-400'
                    : 'border-slate-700/60 text-slate-400 hover:border-slate-600',
                )}>
                  <input type="radio" value="REJECT" {...register('action')} className="accent-red-500" />
                  <Icon icon={X} size={16} />
                  拒绝
                </label>
              </div>
            </div>

            {/* Remark */}
            <FormField
              label="审核意见"
              required={action === 'REJECT'}
              error={errors.remark?.message}
            >
              <textarea
                rows={3}
                placeholder={action === 'REJECT' ? '请填写拒绝原因（必填）' : '可选，填写说明'}
                className={clsx(
                  'w-full resize-none rounded-lg border px-3 py-2 text-sm placeholder-slate-600 bg-slate-800/60 text-slate-200 transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-theme-accent/20',
                  errors.remark
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-slate-700/60 hover:border-slate-600 focus:border-emerald-500/50',
                )}
                {...register('remark', {
                  validate: (val, fv) =>
                    fv.action === 'REJECT' && !val.trim() ? '拒绝时必须填写审核意见' : true,
                })}
              />
            </FormField>

            {mutation.isError && (
              <p className="mt-2 text-xs text-red-500">提交失败，请重试</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>取消</Button>
              <Button
                variant={action === 'APPROVE' ? 'primary' : 'danger'}
                size="sm"
                type="submit"
                loading={mutation.isPending}
              >
                {action === 'APPROVE' ? '通过审核' : '拒绝'}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ─── Quick audit confirm ──────────────────────────────────────────────────────

function QuickAuditConfirm({
  action,
  onConfirm,
  onCancel,
  isPending,
}: {
  action: 'APPROVE' | 'REJECT'
  onConfirm: (remark?: string) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [remark, setRemark] = useState('')

  return (
    <Dialog open onClose={onCancel} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50 p-6">
          <DialogTitle className="text-base font-semibold text-slate-100 mb-4">
            {action === 'APPROVE' ? '确认通过审核？' : '确认拒绝？'}
          </DialogTitle>
          {action === 'REJECT' && (
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-1.5">拒绝原因（必填）</label>
              <textarea
                rows={3}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="请填写拒绝原因"
                className="w-full resize-none rounded-lg border border-slate-700/60 px-3 py-2 text-sm bg-theme-surface focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={onCancel}>取消</Button>
            <Button
              variant={action === 'APPROVE' ? 'primary' : 'danger'}
              size="sm"
              type="button"
              loading={isPending}
              disabled={action === 'REJECT' && !remark.trim()}
              onClick={() => onConfirm(remark.trim() || undefined)}
            >
              {action === 'APPROVE' ? '确认通过' : '确认拒绝'}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ─── Resource Table ───────────────────────────────────────────────────────────

function ResourceTable({
  params,
  page,
  onPageChange,
}: {
  params: { keyword: string; type: string; auditStatus: number }
  page: number
  onPageChange: (p: number) => void
}) {
  const [auditItem, setAuditItem] = useState<AdminResourceVO | null>(null)
  const [quickAction, setQuickAction] = useState<{ item: AdminResourceVO; action: 'APPROVE' | 'REJECT' } | null>(null)
  const mutation = useAuditResource()

  const { data, isLoading } = useAdminResourceList({
    page,
    size: PAGE_SIZE,
    keyword: params.keyword || undefined,
    type: params.type || undefined,
    auditStatus: params.auditStatus >= 0 ? params.auditStatus : undefined,
  })

  const records = data?.records ?? []
  const total = data?.total ?? 0

  function handleQuickConfirm(remark?: string) {
    if (!quickAction) return
    mutation.mutate(
      { id: quickAction.item.id, action: quickAction.action, remark },
      { onSuccess: () => setQuickAction(null) },
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/80">
        {isLoading ? (
          <div className="p-4"><SkeletonList count={5} /></div>
        ) : records.length === 0 ? (
          <EmptyState icon={FileText} title="暂无资源记录" description="当前筛选条件下没有资源" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 w-8 text-slate-500">#</th>
                  <th className="px-4 py-3">标题</th>
                  <th className="px-4 py-3">类型</th>
                  <th className="px-4 py-3">所在省份</th>
                  <th className="px-4 py-3">提交时间</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.id} className="border-t border-slate-800/60 transition-colors hover:bg-slate-800/40/80">
                    <td className="px-4 py-3 text-xs text-slate-500">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-slate-100 truncate" title={r.title}>{r.title}</p>
                      {r.summary && <p className="text-xs text-slate-500 truncate mt-0.5">{r.summary}</p>}
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={r.type} isResource /></td>
                    <td className="px-4 py-3 text-sm text-slate-400">{r.province ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{r.createdAt.slice(0, 10)}</td>
                    <td className="px-4 py-3"><AuditStatusBadge status={r.auditStatus} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 p-0.5">
                        <button
                          className="rounded p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-700/60 hover:text-emerald-400"
                          title="查看详情 / 审核"
                          onClick={() => setAuditItem(r)}
                        >
                          <Icon icon={Eye} size={14} />
                        </button>
                        {r.auditStatus === 0 && (
                          <>
                            <button
                              className="rounded p-1.5 text-emerald-600 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700"
                              title="快速通过"
                              onClick={() => setQuickAction({ item: r, action: 'APPROVE' })}
                            >
                              <Icon icon={CheckCircle2} size={14} />
                            </button>
                            <button
                              className="rounded p-1.5 text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                              title="快速拒绝"
                              onClick={() => setQuickAction({ item: r, action: 'REJECT' })}
                            >
                              <Icon icon={XCircle} size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="border-t border-slate-800/60 px-4 py-4">
            <Pagination page={page} total={total} size={PAGE_SIZE} onChange={onPageChange} />
          </div>
        )}
      </div>

      {auditItem && (
        <AuditModal item={auditItem} isResource onClose={() => setAuditItem(null)} />
      )}

      {quickAction && (
        <QuickAuditConfirm
          action={quickAction.action}
          isPending={mutation.isPending}
          onConfirm={handleQuickConfirm}
          onCancel={() => setQuickAction(null)}
        />
      )}
    </>
  )
}

// ─── Demand Table ─────────────────────────────────────────────────────────────

function DemandTable({
  params,
  page,
  onPageChange,
}: {
  params: { keyword: string; type: string; auditStatus: number }
  page: number
  onPageChange: (p: number) => void
}) {
  const [auditItem, setAuditItem] = useState<AdminDemandVO | null>(null)
  const [quickAction, setQuickAction] = useState<{ item: AdminDemandVO; action: 'APPROVE' | 'REJECT' } | null>(null)
  const mutation = useAuditDemand()

  const { data, isLoading } = useAdminDemandList({
    page,
    size: PAGE_SIZE,
    keyword: params.keyword || undefined,
    type: params.type || undefined,
    auditStatus: params.auditStatus >= 0 ? params.auditStatus : undefined,
  })

  const records = data?.records ?? []
  const total = data?.total ?? 0

  function handleQuickConfirm(remark?: string) {
    if (!quickAction) return
    mutation.mutate(
      { id: quickAction.item.id, action: quickAction.action, remark },
      { onSuccess: () => setQuickAction(null) },
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/80">
        {isLoading ? (
          <div className="p-4"><SkeletonList count={5} /></div>
        ) : records.length === 0 ? (
          <EmptyState icon={FileText} title="暂无需求记录" description="当前筛选条件下没有需求" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 w-8 text-slate-500">#</th>
                  <th className="px-4 py-3">标题</th>
                  <th className="px-4 py-3">类型</th>
                  <th className="px-4 py-3">所在省份</th>
                  <th className="px-4 py-3">提交时间</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.id} className="border-t border-slate-800/60 transition-colors hover:bg-slate-800/40/80">
                    <td className="px-4 py-3 text-xs text-slate-500">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-slate-100 truncate" title={r.title}>{r.title}</p>
                      {r.summary && <p className="text-xs text-slate-500 truncate mt-0.5">{r.summary}</p>}
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={r.type} isResource={false} /></td>
                    <td className="px-4 py-3 text-sm text-slate-400">{r.province ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{r.createdAt.slice(0, 10)}</td>
                    <td className="px-4 py-3"><AuditStatusBadge status={r.auditStatus} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 p-0.5">
                        <button
                          className="rounded p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-700/60 hover:text-emerald-400"
                          title="查看详情 / 审核"
                          onClick={() => setAuditItem(r)}
                        >
                          <Icon icon={Eye} size={14} />
                        </button>
                        {r.auditStatus === 0 && (
                          <>
                            <button
                              className="rounded p-1.5 text-emerald-600 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700"
                              title="快速通过"
                              onClick={() => setQuickAction({ item: r, action: 'APPROVE' })}
                            >
                              <Icon icon={CheckCircle2} size={14} />
                            </button>
                            <button
                              className="rounded p-1.5 text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                              title="快速拒绝"
                              onClick={() => setQuickAction({ item: r, action: 'REJECT' })}
                            >
                              <Icon icon={XCircle} size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="border-t border-slate-800/60 px-4 py-4">
            <Pagination page={page} total={total} size={PAGE_SIZE} onChange={onPageChange} />
          </div>
        )}
      </div>

      {auditItem && (
        <AuditModal item={auditItem} isResource={false} onClose={() => setAuditItem(null)} />
      )}

      {quickAction && (
        <QuickAuditConfirm
          action={quickAction.action}
          isPending={mutation.isPending}
          onConfirm={handleQuickConfirm}
          onCancel={() => setQuickAction(null)}
        />
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupplyAuditPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = (searchParams.get('tab') ?? 'resource') as 'resource' | 'demand'
  const keyword = searchParams.get('keyword') ?? ''
  const type = searchParams.get('type') ?? ''
  const auditStatus = Number(searchParams.get('auditStatus') ?? -1)
  const page = Number(searchParams.get('page') ?? 1)

  const [inputValue, setInputValue] = useState(keyword)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(updates).forEach(([k, v]) => {
          if (v === undefined) next.delete(k)
          else next.set(k, v)
        })
        return next
      }, { replace: true })
    },
    [setSearchParams],
  )

  function switchTab(t: 'resource' | 'demand') {
    setInputValue('')
    setSearchParams({ tab: t }, { replace: true })
  }

  function handleSearchInput(v: string) {
    setInputValue(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setParam({ keyword: v || undefined, page: undefined })
    }, 500)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setParam({ keyword: inputValue || undefined, page: undefined })
  }

  function handleReset() {
    setInputValue('')
    setSearchParams({ tab }, { replace: true })
  }

  const typeOptions = tab === 'resource' ? RESOURCE_TYPE_OPTIONS : DEMAND_TYPE_OPTIONS

  const filterParams = { keyword, type, auditStatus }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-theme-text-main">供需内容审核</h1>
        <p className="mt-0.5 text-sm text-theme-text-muted">审核会员发布的资源与需求信息</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-700/60">
        {(['resource', 'demand'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={clsx(
              'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-slate-400 hover:text-slate-100 hover:border-slate-600',
            )}
          >
            {t === 'resource' ? '资源审核' : '需求审核'}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-800/60 bg-slate-900/80 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">关键词</label>
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Icon icon={Search} size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="标题 / 单位名称"
                className="w-48 rounded-lg border border-slate-700/60 bg-theme-surface py-1.5 pl-9 pr-3 text-sm text-theme-text-main placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
              />
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">类型</label>
          <select
            value={type}
            onChange={(e) => setParam({ type: e.target.value || undefined, page: undefined })}
            className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-sm text-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
          >
            {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">审核状态</label>
          <select
            value={auditStatus}
            onChange={(e) => setParam({ auditStatus: e.target.value === '-1' ? undefined : e.target.value, page: undefined })}
            className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-sm text-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
          >
            {AUDIT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <Button variant="ghost" size="sm" onClick={handleReset}>重置</Button>
      </div>

      {/* Table */}
      {tab === 'resource' ? (
        <ResourceTable
          key="resource"
          params={filterParams}
          page={page}
          onPageChange={(p) => setParam({ page: String(p) })}
        />
      ) : (
        <DemandTable
          key="demand"
          params={filterParams}
          page={page}
          onPageChange={(p) => setParam({ page: String(p) })}
        />
      )}
    </div>
  )
}
