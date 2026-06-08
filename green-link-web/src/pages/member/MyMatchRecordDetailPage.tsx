import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  AlertTriangle, ArrowLeft, Building2, CalendarDays, CheckCircle2,
  FileText, Handshake, MapPin, MessageSquare, Sparkles, XCircle,
} from 'lucide-react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Icon } from '@/components/Icon'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Spinner } from '@/components/Spinner'
import { useMyMatchRecords, useRespondMatch, useUpdateMatchStatus, type MatchRecordItem } from '@/services/matchService'
import type { BadgeVariant } from '@/components/Badge'

// ─── Status metadata ──────────────────────────────────────────────────────────

const STATUS_META: Record<number, { label: string; variant: BadgeVariant; description: string }> = {
  1: { label: '待响应', variant: 'warning',  description: '申请已发送，等待对方回应' },
  2: { label: '已接受', variant: 'news',     description: '对方已接受申请，可进入洽谈阶段' },
  3: { label: '洽谈中', variant: 'success',  description: '双方正在洽谈合作细节' },
  5: { label: '已完成', variant: 'success',  description: '对接已成功完成，感谢您的参与' },
  6: { label: '已拒绝', variant: 'error',    description: '对方已拒绝本次对接申请' },
  7: { label: '已撤销', variant: 'default',  description: '本次对接申请已撤销' },
}

// ─── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  title, description, confirmLabel, danger, isPending, onConfirm, onClose,
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
        <DialogPanel className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 shadow-xl">
          <div className="flex items-start gap-3 mb-4">
            <div className={clsx(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
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
            <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isPending}>取消</Button>
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

// ─── Info section ─────────────────────────────────────────────────────────────

function InfoSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">{label}</p>
      {children}
    </div>
  )
}

// ─── Action buttons ────────────────────────────────────────────────────────────

interface ActionProps {
  record: MatchRecordItem
  onStatusChange: (newStatus: number) => void
}

function ActionButtons({ record, onStatusChange }: ActionProps) {
  const [confirm, setConfirm] = useState<'reject' | 'cancel' | null>(null)

  const respondMutation = useRespondMatch()
  const statusMutation = useUpdateMatchStatus()

  const isPending = respondMutation.isPending || statusMutation.isPending
  const [actionError, setActionError] = useState<string | null>(null)

  function doAction(fn: () => void) {
    setActionError(null)
    fn()
  }

  function handleAccept() {
    doAction(() => {
      respondMutation.mutate(
        { recordId: record.recordId, action: 'ACCEPT' },
        {
          onSuccess: (data) => { setConfirm(null); onStatusChange(data?.status ?? 2) },
          onError: () => setActionError('操作失败，请稍后重试'),
        },
      )
    })
  }

  function handleReject() {
    doAction(() => {
      respondMutation.mutate(
        { recordId: record.recordId, action: 'REJECT' },
        {
          onSuccess: (data) => { setConfirm(null); onStatusChange(data?.status ?? 6) },
          onError: () => setActionError('操作失败，请稍后重试'),
        },
      )
    })
  }

  function handleStatusAction(action: 'NEGOTIATE' | 'COMPLETE' | 'CANCEL') {
    doAction(() => {
      statusMutation.mutate(
        { recordId: record.recordId, action },
        {
          onSuccess: (data) => {
            setConfirm(null)
            onStatusChange(data?.status ?? record.status)
          },
          onError: () => setActionError('操作失败，请稍后重试'),
        },
      )
    })
  }

  const { status, isInitiator } = record

  // Terminal states: no actions
  if (status === 5 || status === 6 || status === 7) {
    return null
  }

  return (
    <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card space-y-3">
      <p className="text-sm font-semibold text-stone-800">可执行操作</p>

      {actionError && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {actionError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {/* Status=1 待响应 */}
        {status === 1 && !isInitiator && (
          <>
            <Button
              variant="primary"
              size="sm"
              loading={respondMutation.isPending && respondMutation.variables?.action === 'ACCEPT'}
              disabled={isPending}
              onClick={handleAccept}
            >
              <Icon icon={CheckCircle2} size={14} className="mr-1" />
              接受申请
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isPending}
              onClick={() => setConfirm('reject')}
            >
              <Icon icon={XCircle} size={14} className="mr-1" />
              拒绝申请
            </Button>
          </>
        )}
        {status === 1 && isInitiator && (
          <Button
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={() => setConfirm('cancel')}
          >
            撤回申请
          </Button>
        )}

        {/* Status=2 已接受 */}
        {status === 2 && (
          <>
            <Button
              variant="primary"
              size="sm"
              loading={statusMutation.isPending && statusMutation.variables?.action === 'NEGOTIATE'}
              disabled={isPending}
              onClick={() => handleStatusAction('NEGOTIATE')}
            >
              进入洽谈
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={() => setConfirm('cancel')}
            >
              撤销对接
            </Button>
          </>
        )}

        {/* Status=3 洽谈中 */}
        {status === 3 && (
          <>
            <Button
              variant="primary"
              size="sm"
              loading={statusMutation.isPending && statusMutation.variables?.action === 'COMPLETE'}
              disabled={isPending}
              onClick={() => handleStatusAction('COMPLETE')}
            >
              <Icon icon={CheckCircle2} size={14} className="mr-1" />
              标记完成
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={() => setConfirm('cancel')}
            >
              撤销对接
            </Button>
          </>
        )}
      </div>

      {/* Confirm dialogs */}
      {confirm === 'reject' && (
        <ConfirmModal
          title="确认拒绝申请？"
          description="拒绝后对方将收到通知，此操作不可撤销。"
          confirmLabel="确认拒绝"
          danger
          isPending={respondMutation.isPending}
          onConfirm={handleReject}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === 'cancel' && (
        <ConfirmModal
          title={status === 1 ? '确认撤回申请？' : '确认撤销对接？'}
          description={status === 1 ? '撤回后对方将不再收到该申请。' : '撤销后对接流程将终止，请谨慎操作。'}
          confirmLabel={status === 1 ? '确认撤回' : '确认撤销'}
          danger
          isPending={statusMutation.isPending}
          onConfirm={() => handleStatusAction('CANCEL')}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyMatchRecordDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()

  const recordId = id && /^\d+$/.test(id) ? Number(id) : null

  // Fast path: record data passed as state from list page
  const stateRecord = (location.state as { record?: MatchRecordItem } | null)?.record
  const [localStatus, setLocalStatus] = useState<number | null>(null)

  // Fallback: fetch all records and find by ID (used when navigating directly via URL)
  const needsFetch = !stateRecord && recordId !== null
  const { data: listData, isLoading: listLoading } = useMyMatchRecords(
    { page: 1, size: 100 },
    needsFetch,
  )

  const baseRecord = stateRecord ?? listData?.records.find((r) => r.recordId === recordId)

  // Merge server record with locally updated status (after mutation)
  const record: MatchRecordItem | undefined = baseRecord
    ? { ...baseRecord, status: localStatus ?? baseRecord.status }
    : undefined

  function handleStatusChange(newStatus: number) {
    setLocalStatus(newStatus)
  }

  // ── Invalid/not found ─────────────────────────────────────────────────────

  if (!recordId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-stone-400 text-sm">无效的对接记录 ID</p>
        <Link to="/member/my-records" className="text-sm text-emerald-600 hover:underline">
          返回对接记录列表
        </Link>
      </div>
    )
  }

  if (listLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-emerald-500" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Icon icon={FileText} size={32} className="text-stone-200" />
        <p className="text-stone-400 text-sm">未找到该对接记录</p>
        <Link to="/member/my-records" className="text-sm text-emerald-600 hover:underline">
          返回对接记录列表
        </Link>
      </div>
    )
  }

  const statusMeta = STATUS_META[record.status] ?? { label: String(record.status), variant: 'default' as BadgeVariant, description: '' }
  const matchTypeLabel = record.matchType === 1 ? '系统推荐' : '主动申请'

  return (
    <div className="flex flex-col gap-4">
      {/* Back */}
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors"
        >
          <Icon icon={ArrowLeft} size={15} />
          返回对接记录
        </button>
      </div>

      {/* Title */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-theme-text-main flex items-center gap-2">
            <Icon icon={Handshake} size={20} className="text-emerald-500 flex-shrink-0" />
            对接记录详情
          </h1>
          <p className="mt-1 text-xs text-stone-400">记录编号 #{record.recordId}</p>
        </div>
        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
      </div>

      {/* Status description */}
      <div className={clsx(
        'rounded-xl border px-4 py-3 text-sm',
        record.status === 5 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
        record.status === 6 ? 'bg-red-50 border-red-200 text-red-700' :
        record.status === 7 ? 'bg-stone-50 border-stone-200 text-stone-600' :
        'bg-blue-50 border-blue-200 text-blue-700',
      )}>
        {statusMeta.description}
        {record.status === 1 && record.isInitiator && (
          <span className="ml-1 font-medium">（您是申请发起方）</span>
        )}
        {record.status === 1 && !record.isInitiator && (
          <span className="ml-1 font-medium">（您是被申请方，请尽快回应）</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Counterparty */}
          {record.counterparty && (
            <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card">
              <InfoSection label="对接方信息">
                <div className="flex items-center gap-2 flex-wrap">
                  <Icon icon={Building2} size={16} className="text-stone-400 flex-shrink-0" />
                  <span className="text-base font-semibold text-stone-900">{record.counterparty.name}</span>
                  {record.counterparty.memberLevel === 2 && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">VIP</span>
                  )}
                  {record.counterparty.memberLevel === 3 && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">理事</span>
                  )}
                  {record.counterparty.province && (
                    <span className="flex items-center gap-1 text-xs text-stone-400">
                      <Icon icon={MapPin} size={12} />
                      {record.counterparty.province}
                    </span>
                  )}
                </div>
              </InfoSection>
            </div>
          )}

          {/* Titles */}
          <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card space-y-4">
            <InfoSection label="对接资源与需求">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="flex-shrink-0 rounded bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 leading-tight mt-0.5">资源</span>
                  <p className="text-sm text-stone-800 leading-relaxed">
                    {record.resourceTitle ?? <span className="text-stone-400 italic">（资源已下架）</span>}
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <span className="flex-shrink-0 rounded bg-blue-100 border border-blue-200 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 leading-tight mt-0.5">需求</span>
                  <p className="text-sm text-stone-800 leading-relaxed">
                    {record.demandTitle ?? <span className="text-stone-400 italic">（需求已关闭）</span>}
                  </p>
                </div>
              </div>
            </InfoSection>
          </div>

          {/* Apply message */}
          {record.applyMessage && (
            <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card">
              <InfoSection label="申请留言">
                <div className="flex gap-3">
                  <Icon icon={MessageSquare} size={16} className="text-stone-300 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                    {record.applyMessage}
                  </p>
                </div>
              </InfoSection>
            </div>
          )}

          {/* Actions */}
          <ActionButtons record={record} onStatusChange={handleStatusChange} />
        </div>

        {/* Right: meta info */}
        <div className="space-y-4">
          <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">基本信息</p>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-stone-400 mb-0.5">申请方式</p>
                <div className="flex items-center gap-1.5">
                  <Icon icon={matchTypeLabel === '系统推荐' ? Sparkles : Handshake} size={13} className="text-stone-400" />
                  <span className="text-stone-700">{matchTypeLabel}</span>
                </div>
              </div>

              {record.matchScore !== null && (
                <div>
                  <p className="text-xs text-stone-400 mb-0.5">匹配度</p>
                  <p className="text-stone-700 font-semibold text-emerald-600">
                    {Math.round(Number(record.matchScore))} 分
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-stone-400 mb-0.5">发起时间</p>
                <div className="flex items-center gap-1.5">
                  <Icon icon={CalendarDays} size={13} className="text-stone-400" />
                  <span className="text-stone-700">{record.createdAt.slice(0, 10)}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-stone-400 mb-0.5">最近更新</p>
                <div className="flex items-center gap-1.5">
                  <Icon icon={CalendarDays} size={13} className="text-stone-400" />
                  <span className="text-stone-700">{record.updatedAt.slice(0, 10)}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-stone-400 mb-0.5">我的角色</p>
                <p className="text-stone-700">{record.isInitiator ? '申请发起方' : '申请接收方'}</p>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">快速跳转</p>
            {record.resourceId && (
              <Link
                to={`/supply/resources/${record.resourceId}`}
                target="_blank"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-emerald-600 transition-colors"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                查看资源详情
              </Link>
            )}
            {record.demandId && (
              <Link
                to={`/supply/demands/${record.demandId}`}
                target="_blank"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-blue-600 transition-colors"
              >
                <span className="h-2 w-2 rounded-full bg-blue-400 flex-shrink-0" />
                查看需求详情
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
