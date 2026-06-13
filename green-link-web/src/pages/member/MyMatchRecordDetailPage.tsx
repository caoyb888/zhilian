import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  AlertTriangle, ArrowLeft, Building2, CalendarDays, CheckCircle2,
  FileText, Handshake, MapPin, MessageCircle, MessageSquare, Sparkles, XCircle,
} from 'lucide-react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Icon } from '@/components/Icon'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Spinner } from '@/components/Spinner'
import { useMyMatchRecords, useRespondMatch, useUpdateMatchStatus, type MatchRecordItem } from '@/services/matchService'
import type { BadgeVariant } from '@/components/Badge'

// ─── Status metadata ──────────────────────────────────────────────────────────

const STATUS_META: Record<number, {
  label: string
  variant: BadgeVariant
  description: string
  heroBg: string
  heroText: string
  bannerBg: string
  bannerBorder: string
  bannerText: string
}> = {
  1: {
    label: '待响应', variant: 'warning',
    description: '申请已发送，等待对方回应',
    heroBg: 'linear-gradient(135deg, #92400e 0%, #d97706 100%)',
    heroText: 'text-amber-100',
    bannerBg: 'bg-amber-50', bannerBorder: 'border-amber-200', bannerText: 'text-amber-700',
  },
  2: {
    label: '已接受', variant: 'news',
    description: '对方已接受申请，可进入洽谈阶段',
    heroBg: 'linear-gradient(135deg, #0369a1 0%, #0891b2 100%)',
    heroText: 'text-blue-100',
    bannerBg: 'bg-blue-50', bannerBorder: 'border-blue-200', bannerText: 'text-blue-700',
  },
  3: {
    label: '洽谈中', variant: 'success',
    description: '双方正在洽谈合作细节',
    heroBg: 'linear-gradient(135deg, #065f46 0%, #0d9488 100%)',
    heroText: 'text-emerald-100',
    bannerBg: 'bg-emerald-50', bannerBorder: 'border-emerald-200', bannerText: 'text-emerald-700',
  },
  5: {
    label: '已完成', variant: 'success',
    description: '对接已成功完成，感谢您的参与',
    heroBg: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
    heroText: 'text-emerald-100',
    bannerBg: 'bg-emerald-50', bannerBorder: 'border-emerald-200', bannerText: 'text-emerald-700',
  },
  6: {
    label: '已拒绝', variant: 'error',
    description: '对方已拒绝本次对接申请',
    heroBg: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
    heroText: 'text-red-100',
    bannerBg: 'bg-red-50', bannerBorder: 'border-red-200', bannerText: 'text-red-700',
  },
  7: {
    label: '已撤销', variant: 'default',
    description: '本次对接申请已撤销',
    heroBg: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
    heroText: 'text-stone-200',
    bannerBg: 'bg-stone-50', bannerBorder: 'border-stone-200', bannerText: 'text-stone-600',
  },
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
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-nordic p-6">
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
            <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isPending}>取消</Button>
            <Button variant={danger ? 'danger' : 'primary'} size="sm" type="button" loading={isPending} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
      <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">{children}</p>
    </div>
  )
}

// ─── Action buttons ────────────────────────────────────────────────────────────

function ActionButtons({ record, onStatusChange }: { record: MatchRecordItem; onStatusChange: (s: number) => void }) {
  const [confirm, setConfirm] = useState<'reject' | 'cancel' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const respondMutation = useRespondMatch()
  const statusMutation  = useUpdateMatchStatus()
  const isPending = respondMutation.isPending || statusMutation.isPending

  function handleAccept() {
    setActionError(null)
    respondMutation.mutate(
      { recordId: record.recordId, action: 'ACCEPT' },
      {
        onSuccess: (data) => { setConfirm(null); onStatusChange(data?.status ?? 2) },
        onError: () => setActionError('操作失败，请稍后重试'),
      },
    )
  }

  function handleReject() {
    setActionError(null)
    respondMutation.mutate(
      { recordId: record.recordId, action: 'REJECT' },
      {
        onSuccess: (data) => { setConfirm(null); onStatusChange(data?.status ?? 6) },
        onError: () => setActionError('操作失败，请稍后重试'),
      },
    )
  }

  function handleStatusAction(action: 'NEGOTIATE' | 'COMPLETE' | 'CANCEL') {
    setActionError(null)
    statusMutation.mutate(
      { recordId: record.recordId, action },
      {
        onSuccess: (data) => { setConfirm(null); onStatusChange(data?.status ?? record.status) },
        onError: () => setActionError('操作失败，请稍后重试'),
      },
    )
  }

  const { status, isInitiator } = record
  if (status === 5 || status === 6 || status === 7) return null

  return (
    <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card">
      <SectionLabel>可执行操作</SectionLabel>

      {actionError && (
        <p className="mb-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
          {actionError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {status === 1 && !isInitiator && (
          <>
            <Button
              variant="primary" size="sm"
              loading={respondMutation.isPending && respondMutation.variables?.action === 'ACCEPT'}
              disabled={isPending}
              onClick={handleAccept}
            >
              <Icon icon={CheckCircle2} size={14} className="mr-1" />
              接受申请
            </Button>
            <Button variant="danger" size="sm" disabled={isPending} onClick={() => setConfirm('reject')}>
              <Icon icon={XCircle} size={14} className="mr-1" />
              拒绝申请
            </Button>
          </>
        )}
        {status === 1 && isInitiator && (
          <Button variant="secondary" size="sm" disabled={isPending} onClick={() => setConfirm('cancel')}>
            撤回申请
          </Button>
        )}
        {status === 2 && (
          <>
            <Button
              variant="primary" size="sm"
              loading={statusMutation.isPending && statusMutation.variables?.action === 'NEGOTIATE'}
              disabled={isPending}
              onClick={() => handleStatusAction('NEGOTIATE')}
            >
              进入洽谈
            </Button>
            <Button variant="secondary" size="sm" disabled={isPending} onClick={() => setConfirm('cancel')}>
              撤销对接
            </Button>
          </>
        )}
        {status === 3 && (
          <>
            <Button
              variant="primary" size="sm"
              loading={statusMutation.isPending && statusMutation.variables?.action === 'COMPLETE'}
              disabled={isPending}
              onClick={() => handleStatusAction('COMPLETE')}
            >
              <Icon icon={CheckCircle2} size={14} className="mr-1" />
              标记完成
            </Button>
            <Button variant="secondary" size="sm" disabled={isPending} onClick={() => setConfirm('cancel')}>
              撤销对接
            </Button>
          </>
        )}
      </div>

      {confirm === 'reject' && (
        <ConfirmModal
          title="确认拒绝申请？"
          description="拒绝后对方将收到通知，此操作不可撤销。"
          confirmLabel="确认拒绝" danger
          isPending={respondMutation.isPending}
          onConfirm={handleReject}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === 'cancel' && (
        <ConfirmModal
          title={status === 1 ? '确认撤回申请？' : '确认撤销对接？'}
          description={status === 1 ? '撤回后对方将不再收到该申请。' : '撤销后对接流程将终止，请谨慎操作。'}
          confirmLabel={status === 1 ? '确认撤回' : '确认撤销'} danger
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
  const { id }       = useParams<{ id: string }>()
  const location     = useLocation()
  const navigate     = useNavigate()
  const recordId     = id && /^\d+$/.test(id) ? Number(id) : null
  const stateRecord  = (location.state as { record?: MatchRecordItem } | null)?.record
  const [localStatus, setLocalStatus] = useState<number | null>(null)

  const needsFetch = !stateRecord && recordId !== null
  const { data: listData, isLoading: listLoading } = useMyMatchRecords({ page: 1, size: 100 }, needsFetch)

  const baseRecord = stateRecord ?? listData?.records.find((r) => r.recordId === recordId)
  const record: MatchRecordItem | undefined = baseRecord
    ? { ...baseRecord, status: localStatus ?? baseRecord.status }
    : undefined

  // ── Guards ────────────────────────────────────────────────────────────────

  if (!recordId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-stone-400 text-sm">无效的对接记录 ID</p>
        <Link to="/member/my-records" className="text-sm text-emerald-600 hover:underline">返回对接记录列表</Link>
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
        <Link to="/member/my-records" className="text-sm text-emerald-600 hover:underline">返回对接记录列表</Link>
      </div>
    )
  }

  const statusMeta    = STATUS_META[record.status] ?? STATUS_META[7]
  const matchTypeLabel = record.matchType === 1 ? '系统推荐' : '主动申请'

  return (
    <div className="flex flex-col gap-4">

      {/* ── Back ── */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors -ml-2"
      >
        <Icon icon={ArrowLeft} size={14} />
        返回对接记录
      </button>

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <div className="absolute inset-0" style={{ background: statusMeta.heroBg }} />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8), transparent)' }}
        />

        <div className="relative px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                <Icon icon={Handshake} size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">对接记录详情</h1>
                <p className={clsx('mt-0.5 text-sm', statusMeta.heroText)}>
                  记录编号 #{record.recordId} · {statusMeta.label}
                </p>
              </div>
            </div>
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          </div>

          {/* Status description */}
          <div className={clsx('mt-4 rounded-xl border px-4 py-2.5 text-sm', statusMeta.bannerBg, statusMeta.bannerBorder, statusMeta.bannerText)}>
            {statusMeta.description}
            {record.status === 1 && record.isInitiator && <span className="ml-1 font-medium">（您是申请发起方）</span>}
            {record.status === 1 && !record.isInitiator && <span className="ml-1 font-medium">（您是被申请方，请尽快回应）</span>}
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left col */}
        <div className="lg:col-span-2 space-y-4">

          {/* Counterparty */}
          {record.counterparty && (
            <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card">
              <SectionLabel>对接方信息</SectionLabel>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200 text-sm font-bold text-emerald-700">
                  {record.counterparty.name.charAt(0)}
                </div>
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
            </div>
          )}

          {/* Resource & demand */}
          <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card space-y-3">
            <SectionLabel>对接资源与需求</SectionLabel>
            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3.5">
              <span className="shrink-0 rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 mt-0.5">资源</span>
              <p className="text-sm text-stone-800 leading-relaxed">
                {record.resourceTitle ?? <span className="text-stone-400 italic">（资源已下架）</span>}
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-3.5">
              <span className="shrink-0 rounded-full bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700 mt-0.5">需求</span>
              <p className="text-sm text-stone-800 leading-relaxed">
                {record.demandTitle ?? <span className="text-stone-400 italic">（需求已关闭）</span>}
              </p>
            </div>
          </div>

          {/* Apply message */}
          {record.applyMessage && (
            <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card">
              <SectionLabel>申请留言</SectionLabel>
              <div className="flex gap-3">
                <Icon icon={MessageSquare} size={16} className="text-stone-300 shrink-0 mt-0.5" />
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{record.applyMessage}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <ActionButtons record={record} onStatusChange={setLocalStatus} />
        </div>

        {/* Right col */}
        <div className="space-y-4">

          {/* Meta info */}
          <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card">
            <SectionLabel>基本信息</SectionLabel>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-stone-400 text-xs">申请方式</span>
                <div className="flex items-center gap-1.5 text-stone-700">
                  <Icon icon={matchTypeLabel === '系统推荐' ? Sparkles : Handshake} size={12} className="text-stone-400" />
                  <span>{matchTypeLabel}</span>
                </div>
              </div>

              {record.matchScore !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 text-xs">匹配度</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(100, Math.round(Number(record.matchScore)))}%` }}
                      />
                    </div>
                    <span className="text-emerald-600 font-semibold text-xs tabular-nums">
                      {Math.round(Number(record.matchScore))} 分
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-stone-400 text-xs">我的角色</span>
                <span className="text-stone-700 text-xs">{record.isInitiator ? '申请发起方' : '申请接收方'}</span>
              </div>

              <div className="h-px bg-stone-100" />

              <div className="flex items-center justify-between">
                <span className="text-stone-400 text-xs">发起时间</span>
                <div className="flex items-center gap-1 text-stone-600 text-xs tabular-nums">
                  <Icon icon={CalendarDays} size={12} className="text-stone-300" />
                  {record.createdAt.slice(0, 10)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-400 text-xs">最近更新</span>
                <div className="flex items-center gap-1 text-stone-600 text-xs tabular-nums">
                  <Icon icon={CalendarDays} size={12} className="text-stone-300" />
                  {record.updatedAt.slice(0, 10)}
                </div>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card">
            <SectionLabel>快速跳转</SectionLabel>
            <div className="space-y-1">
              <Link
                to={`/member/my-records/${record.recordId}/chat`}
                state={{ record }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-stone-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                <Icon icon={MessageCircle} size={14} className="text-emerald-500 shrink-0" />
                <span className="flex-1">进入对接沟通</span>
                {record.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {record.unreadCount > 99 ? '99+' : record.unreadCount}
                  </span>
                )}
              </Link>

              {record.resourceId && (
                <Link
                  to={`/supply/resources/${record.resourceId}`}
                  target="_blank"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-stone-600 hover:bg-emerald-50/60 hover:text-stone-800 transition-colors"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="flex-1">查看资源详情</span>
                  <Icon icon={Building2} size={12} className="text-stone-300" />
                </Link>
              )}

              {record.demandId && (
                <Link
                  to={`/supply/demands/${record.demandId}`}
                  target="_blank"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-stone-600 hover:bg-blue-50/60 hover:text-stone-800 transition-colors"
                >
                  <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                  <span className="flex-1">查看需求详情</span>
                  <Icon icon={Building2} size={12} className="text-stone-300" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
