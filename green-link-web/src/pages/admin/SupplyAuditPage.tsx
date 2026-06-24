import { useCallback, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { clsx } from 'clsx'
import {
  CheckCircle2, Eye, FileText, Search, X, XCircle,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Pagination } from '@/components/Pagination'
import { EmptyState } from '@/components/states/EmptyState'
import { SkeletonList } from '@/components/states/SkeletonList'
import {
  useAdminResourceList,
  useAdminDemandList,
  useAuditResource,
  useAuditDemand,
  useBatchAuditResource,
  useBatchAuditDemand,
  type AdminResourceVO,
  type AdminDemandVO,
} from '@/services/supplyAdminService'
import {
  RESOURCE_TYPE_LABELS,
  DEMAND_TYPE_LABELS,
  useResourceDetail,
  useDemandDetail,
} from '@/services/supplyService'
import DOMPurify from 'dompurify'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

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

type AuditItem = AdminResourceVO | AdminDemandVO

// ─── Detail View Modal（#7 详情与审核分开：只读完整详情）─────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex gap-3 py-1.5 text-sm">
      <span className="w-24 shrink-0 text-slate-500">{label}</span>
      <span className="text-slate-200 break-all">{value}</span>
    </div>
  )
}

function DetailViewModal({
  item,
  isResource,
  onClose,
  onAudit,
}: {
  item: AuditItem
  isResource: boolean
  onClose: () => void
  onAudit: (action: 'APPROVE' | 'REJECT') => void
}) {
  const resourceQuery = useResourceDetail(isResource ? item.id : null)
  const demandQuery = useDemandDetail(isResource ? null : item.id)
  const query = isResource ? resourceQuery : demandQuery
  const detail = query.data
  const typeLabel = isResource
    ? (RESOURCE_TYPE_LABELS[item.type] ?? item.type)
    : (DEMAND_TYPE_LABELS[item.type] ?? item.type)
  const sanitized = DOMPurify.sanitize(detail?.content ?? '')
  const isPending = item.auditStatus === 0

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-slate-800/60 px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-100">
              {isResource ? '资源' : '需求'}详情
            </DialogTitle>
            <button className="rounded p-1 text-slate-500 hover:bg-slate-700/60 hover:text-slate-200" onClick={onClose} aria-label="关闭">
              <Icon icon={X} size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <h3 className="mb-1 text-lg font-semibold text-slate-100">{item.title}</h3>
            <div className="mb-4 flex items-center gap-2">
              <TypeBadge type={item.type} isResource={isResource} />
              <AuditStatusBadge status={item.auditStatus} />
            </div>

            {query.isLoading ? (
              <SkeletonList count={4} />
            ) : (
              <>
                <div className="divide-y divide-slate-800/40 rounded-lg bg-slate-800/30 px-4 py-2">
                  <DetailRow label="类型" value={typeLabel} />
                  <DetailRow label="所在地区" value={[detail?.province, (detail as { city?: string | null } | undefined)?.city].filter(Boolean).join(' / ')} />
                  <DetailRow label="合作方式" value={detail?.cooperationMode} />
                  {isResource
                    ? <DetailRow label="有效期" value={(detail as { validUntil?: string | null } | undefined)?.validUntil} />
                    : (
                      <>
                        <DetailRow label="预算(万元)" value={formatBudget(detail as { budgetMin?: number | null; budgetMax?: number | null } | undefined)} />
                        <DetailRow label="截止日期" value={(detail as { deadline?: string | null } | undefined)?.deadline} />
                      </>
                    )}
                  <DetailRow label="浏览量" value={detail?.viewCount} />
                  <DetailRow label="提交时间" value={item.createdAt?.slice(0, 19).replace('T', ' ')} />
                  {item.auditRemark && <DetailRow label="审核备注" value={item.auditRemark} />}
                </div>

                {detail?.summary && (
                  <div className="mt-4">
                    <p className="mb-1 text-sm font-medium text-slate-400">摘要</p>
                    <p className="text-sm text-slate-300">{detail.summary}</p>
                  </div>
                )}

                {sanitized && (
                  <div className="mt-4">
                    <p className="mb-1 text-sm font-medium text-slate-400">详细描述</p>
                    <div
                      className="prose prose-invert prose-sm max-w-none rounded-lg bg-slate-800/30 p-4 text-slate-200"
                      dangerouslySetInnerHTML={{ __html: sanitized }}
                    />
                  </div>
                )}

                {detail && detail.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {detail.tags.map((t) => (
                      <span key={t.id} className="rounded-full bg-emerald-950/40 px-2.5 py-1 text-xs text-emerald-400 ring-1 ring-emerald-500/30">#{t.name}</span>
                    ))}
                  </div>
                )}

                {detail && detail.attachments.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-slate-400">附件（{detail.attachments.length}）</p>
                    <div className="space-y-1.5">
                      {detail.attachments.map((a) => (
                        <a key={a.id} href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                           className="block truncate rounded-md bg-slate-800/40 px-3 py-2 text-sm text-emerald-400 hover:bg-slate-800">
                          {a.fileName}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-800/60 px-6 py-4">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>关闭</Button>
            {isPending && (
              <>
                <Button variant="danger" size="sm" type="button" onClick={() => onAudit('REJECT')}>拒绝</Button>
                <Button variant="primary" size="sm" type="button" onClick={() => onAudit('APPROVE')}>通过审核</Button>
              </>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

function formatBudget(d?: { budgetMin?: number | null; budgetMax?: number | null }): string {
  if (!d) return ''
  const { budgetMin: min, budgetMax: max } = d
  if (min == null && max == null) return '面议'
  if (min != null && max != null) return `${min} – ${max}`
  if (min != null) return `${min} 起`
  return `≤ ${max}`
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
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [batchAction, setBatchAction] = useState<'APPROVE' | 'REJECT' | null>(null)
  const mutation = useAuditResource()
  const batchMutation = useBatchAuditResource()

  const { data, isLoading } = useAdminResourceList({
    page,
    size: PAGE_SIZE,
    keyword: params.keyword || undefined,
    type: params.type || undefined,
    auditStatus: params.auditStatus >= 0 ? params.auditStatus : undefined,
  })

  const records = data?.records ?? []
  const total = data?.total ?? 0

  // 仅待审核项可批量；翻页/筛选变化时清空已选
  const pendingIds = records.filter((r) => r.auditStatus === 0).map((r) => r.id)
  // 只对当前页待审核项生效，自动忽略翻页/筛选后已失效的旧选择（避免在 effect 内 setState）
  const effectiveSelected = selectedIds.filter((id) => pendingIds.includes(id))
  const allSelected = pendingIds.length > 0 && pendingIds.every((id) => selectedIds.includes(id))

  function toggleOne(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }
  function toggleAll() {
    setSelectedIds(allSelected ? [] : pendingIds)
  }

  function handleBatchConfirm(remark?: string) {
    if (!batchAction || effectiveSelected.length === 0) return
    batchMutation.mutate(
      { ids: effectiveSelected, action: batchAction, remark },
      {
        onSuccess: (res) => {
          setBatchAction(null)
          setSelectedIds([])
          if (res && res.failed > 0) {
            window.alert(`批量处理完成：成功 ${res.success} 条，失败 ${res.failed} 条\n${res.errors.join('\n')}`)
          }
        },
      },
    )
  }

  function handleQuickConfirm(remark?: string) {
    if (!quickAction) return
    mutation.mutate(
      { id: quickAction.item.id, action: quickAction.action, remark },
      { onSuccess: () => setQuickAction(null) },
    )
  }

  return (
    <>
      {effectiveSelected.length > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-700/40 bg-emerald-900/20 px-4 py-2.5">
          <span className="text-sm text-emerald-300">已选 {effectiveSelected.length} 项</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => setBatchAction('APPROVE')}>批量通过</Button>
            <Button size="sm" variant="danger" onClick={() => setBatchAction('REJECT')}>批量拒绝</Button>
            <Button size="sm" variant="secondary" onClick={() => setSelectedIds([])}>取消</Button>
          </div>
        </div>
      )}
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
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      disabled={pendingIds.length === 0}
                      onChange={toggleAll}
                      aria-label="全选待审核"
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-4 py-3">标题</th>
                  <th className="px-4 py-3">类型</th>
                  <th className="px-4 py-3">所在省份</th>
                  <th className="px-4 py-3">提交时间</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-t border-slate-800/60 transition-colors hover:bg-slate-800/40/80">
                    <td className="px-4 py-3">
                      {r.auditStatus === 0 ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(r.id)}
                          onChange={() => toggleOne(r.id)}
                          aria-label={`选择 ${r.title}`}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                        />
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
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
                          title="查看详情"
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
        <DetailViewModal
          item={auditItem}
          isResource
          onClose={() => setAuditItem(null)}
          onAudit={(action) => { const it = auditItem; setAuditItem(null); setQuickAction({ item: it, action }) }}
        />
      )}

      {quickAction && (
        <QuickAuditConfirm
          action={quickAction.action}
          isPending={mutation.isPending}
          onConfirm={handleQuickConfirm}
          onCancel={() => setQuickAction(null)}
        />
      )}

      {batchAction && (
        <QuickAuditConfirm
          action={batchAction}
          isPending={batchMutation.isPending}
          onConfirm={handleBatchConfirm}
          onCancel={() => setBatchAction(null)}
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
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [batchAction, setBatchAction] = useState<'APPROVE' | 'REJECT' | null>(null)
  const mutation = useAuditDemand()
  const batchMutation = useBatchAuditDemand()

  const { data, isLoading } = useAdminDemandList({
    page,
    size: PAGE_SIZE,
    keyword: params.keyword || undefined,
    type: params.type || undefined,
    auditStatus: params.auditStatus >= 0 ? params.auditStatus : undefined,
  })

  const records = data?.records ?? []
  const total = data?.total ?? 0

  const pendingIds = records.filter((r) => r.auditStatus === 0).map((r) => r.id)
  // 只对当前页待审核项生效，自动忽略翻页/筛选后已失效的旧选择（避免在 effect 内 setState）
  const effectiveSelected = selectedIds.filter((id) => pendingIds.includes(id))
  const allSelected = pendingIds.length > 0 && pendingIds.every((id) => selectedIds.includes(id))

  function toggleOne(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }
  function toggleAll() {
    setSelectedIds(allSelected ? [] : pendingIds)
  }

  function handleBatchConfirm(remark?: string) {
    if (!batchAction || effectiveSelected.length === 0) return
    batchMutation.mutate(
      { ids: effectiveSelected, action: batchAction, remark },
      {
        onSuccess: (res) => {
          setBatchAction(null)
          setSelectedIds([])
          if (res && res.failed > 0) {
            window.alert(`批量处理完成：成功 ${res.success} 条，失败 ${res.failed} 条\n${res.errors.join('\n')}`)
          }
        },
      },
    )
  }

  function handleQuickConfirm(remark?: string) {
    if (!quickAction) return
    mutation.mutate(
      { id: quickAction.item.id, action: quickAction.action, remark },
      { onSuccess: () => setQuickAction(null) },
    )
  }

  return (
    <>
      {effectiveSelected.length > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-700/40 bg-emerald-900/20 px-4 py-2.5">
          <span className="text-sm text-emerald-300">已选 {effectiveSelected.length} 项</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => setBatchAction('APPROVE')}>批量通过</Button>
            <Button size="sm" variant="danger" onClick={() => setBatchAction('REJECT')}>批量拒绝</Button>
            <Button size="sm" variant="secondary" onClick={() => setSelectedIds([])}>取消</Button>
          </div>
        </div>
      )}
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
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      disabled={pendingIds.length === 0}
                      onChange={toggleAll}
                      aria-label="全选待审核"
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-4 py-3">标题</th>
                  <th className="px-4 py-3">类型</th>
                  <th className="px-4 py-3">所在省份</th>
                  <th className="px-4 py-3">提交时间</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-t border-slate-800/60 transition-colors hover:bg-slate-800/40/80">
                    <td className="px-4 py-3">
                      {r.auditStatus === 0 ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(r.id)}
                          onChange={() => toggleOne(r.id)}
                          aria-label={`选择 ${r.title}`}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                        />
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
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
                          title="查看详情"
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
        <DetailViewModal
          item={auditItem}
          isResource={false}
          onClose={() => setAuditItem(null)}
          onAudit={(action) => { const it = auditItem; setAuditItem(null); setQuickAction({ item: it, action }) }}
        />
      )}

      {quickAction && (
        <QuickAuditConfirm
          action={quickAction.action}
          isPending={mutation.isPending}
          onConfirm={handleQuickConfirm}
          onCancel={() => setQuickAction(null)}
        />
      )}

      {batchAction && (
        <QuickAuditConfirm
          action={batchAction}
          isPending={batchMutation.isPending}
          onConfirm={handleBatchConfirm}
          onCancel={() => setBatchAction(null)}
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

  const resourcePendingQuery = useAdminResourceList({ page: 1, size: 1, auditStatus: 0 })
  const resourceApprovedQuery = useAdminResourceList({ page: 1, size: 1, auditStatus: 1 })
  const demandPendingQuery = useAdminDemandList({ page: 1, size: 1, auditStatus: 0 })
  const demandApprovedQuery = useAdminDemandList({ page: 1, size: 1, auditStatus: 1 })

  const pendingCount = tab === 'resource'
    ? (resourcePendingQuery.data?.total ?? 0)
    : (demandPendingQuery.data?.total ?? 0)
  const approvedCount = tab === 'resource'
    ? (resourceApprovedQuery.data?.total ?? 0)
    : (demandApprovedQuery.data?.total ?? 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-theme-text-muted">审核会员发布的资源与需求信息</p>
        <div className="flex flex-wrap gap-1">
          {(['resource', 'demand'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={clsx(
                'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
                tab === t
                  ? 'bg-theme-accent text-white'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/60',
              )}
            >
              {t === 'resource' ? '资源审核' : '需求审核'}
            </button>
          ))}
        </div>
        {approvedCount > 0 && (
          <Badge variant="success">{approvedCount} 已通过</Badge>
        )}
        {pendingCount > 0 && (
          <Badge variant="warning">{pendingCount} 待审核</Badge>
        )}
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
