import { useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronRight, Loader2, X } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Spinner } from '@/components/Spinner'
import {
  useMyResources,
  useMyDemands,
  RESOURCE_TYPE_LABELS,
  DEMAND_TYPE_LABELS,
  type ResourceItem,
  type DemandItem,
} from '@/services/supplyService'
import { useApplyMatch, getApplyErrorMsg } from '@/services/matchService'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApplyTarget {
  type: 'RESOURCE' | 'DEMAND'
  id: number
  title: string
}

export interface ApplyMatchDialogProps {
  target: ApplyTarget
  /** Pre-select this source item (the user's own resource/demand id) */
  defaultSourceId?: number
  onClose: () => void
}

// ─── Source item row ──────────────────────────────────────────────────────────

function SourceRow({
  item,
  typeLabel,
  selected,
  onClick,
}: {
  item: ResourceItem | DemandItem
  typeLabel: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left rounded-lg px-3 py-2.5 transition-all duration-150',
        selected
          ? 'bg-emerald-50 border border-emerald-300'
          : 'hover:bg-stone-50 border border-transparent',
      ].join(' ')}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={[
            'mt-0.5 flex-shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center',
            selected ? 'border-emerald-500 bg-emerald-500' : 'border-stone-300 bg-white',
          ].join(' ')}
        >
          {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-stone-800 line-clamp-2 leading-snug">{item.title}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">{typeLabel}</p>
        </div>
      </div>
    </button>
  )
}

// ─── Success panel ────────────────────────────────────────────────────────────

function SuccessPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="px-6 py-8 flex flex-col items-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
        <Icon icon={CheckCircle2} size={28} className="text-emerald-500" />
      </div>
      <h3 className="text-base font-semibold text-stone-900 mb-2">申请已发送！</h3>
      <p className="text-sm text-stone-500 mb-6">对方将收到通知，请留意对接回应消息。</p>
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
      >
        知道了
      </button>
    </div>
  )
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

export function ApplyMatchDialog({ target, defaultSourceId, onClose }: ApplyMatchDialogProps) {
  const [selectedId, setSelectedId] = useState<number | null>(defaultSourceId ?? null)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const applyMutation = useApplyMatch()

  // Opposite of the target type: if target is RESOURCE, user picks from their demands, and vice versa
  const oppositeType: 'RESOURCE' | 'DEMAND' = target.type === 'RESOURCE' ? 'DEMAND' : 'RESOURCE'
  const oppositeLabel = oppositeType === 'RESOURCE' ? '资源' : '需求'
  const publishPath = oppositeType === 'RESOURCE' ? '/supply/publish' : '/supply/demands/publish'

  // Always call both hooks (React rules), use the relevant one
  const { data: resourceData, isLoading: resLoading } = useMyResources({ page: 1, size: 50, auditStatus: 1 })
  const { data: demandData, isLoading: demLoading } = useMyDemands({ page: 1, size: 50, auditStatus: 1 })

  const items: Array<ResourceItem | DemandItem> =
    oppositeType === 'RESOURCE' ? (resourceData?.records ?? []) : (demandData?.records ?? [])
  const typeLabels = oppositeType === 'RESOURCE' ? RESOURCE_TYPE_LABELS : DEMAND_TYPE_LABELS
  const isLoading = oppositeType === 'RESOURCE' ? resLoading : demLoading

  function handleSubmit() {
    if (!selectedId) return
    setErrorMsg(null)
    const body =
      target.type === 'RESOURCE'
        ? { resourceId: target.id, demandId: selectedId, applyMessage: message || undefined }
        : { resourceId: selectedId, demandId: target.id, applyMessage: message || undefined }

    applyMutation.mutate(body, {
      onSuccess: () => setSuccess(true),
      onError: (err) => setErrorMsg(getApplyErrorMsg(err)),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[480px] rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-stone-900">发起对接申请</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 transition-colors"
          >
            <Icon icon={X} size={18} />
          </button>
        </div>

        {/* Body */}
        {success ? (
          <SuccessPanel onClose={onClose} />
        ) : (
          <>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Target info */}
              <div>
                <p className="text-xs font-medium text-stone-500 mb-1.5">对接目标</p>
                <div className="rounded-lg bg-stone-50 border border-stone-200 px-3.5 py-2.5">
                  <p className="text-sm font-medium text-stone-800 line-clamp-2">{target.title}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {target.type === 'RESOURCE' ? '资源' : '需求'}
                  </p>
                </div>
              </div>

              {/* Source selector */}
              <div>
                <p className="text-xs font-medium text-stone-500 mb-1.5">
                  选择我的{oppositeLabel}
                  <span className="ml-1 font-normal text-stone-400">（参与本次对接）</span>
                </p>

                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner size="sm" className="text-stone-300" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-stone-200 px-4 py-6 text-center">
                    <p className="text-sm text-stone-400 mb-1">暂无已审核通过的{oppositeLabel}</p>
                    <p className="text-xs text-stone-400">
                      请先
                      <a
                        href={publishPath}
                        className="text-emerald-600 hover:underline mx-1"
                      >
                        发布{oppositeLabel}
                      </a>
                      并等待审核通过后再发起对接
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 rounded-lg border border-stone-200 p-1.5 max-h-[180px] overflow-y-auto">
                    {items.map((item) => (
                      <SourceRow
                        key={item.id}
                        item={item}
                        typeLabel={typeLabels[item.type] ?? item.type}
                        selected={selectedId === item.id}
                        onClick={() => setSelectedId(item.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1.5 block">
                  申请留言
                  <span className="ml-1 font-normal text-stone-400">（选填，最多 1000 字）</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                  placeholder="可简要描述合作意向，有助于对方更快回应…"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                />
                {message.length > 800 && (
                  <p className="text-right text-[11px] text-stone-400 mt-0.5">{message.length}/1000</p>
                )}
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3.5 py-2.5 text-sm text-red-600">
                  <Icon icon={AlertCircle} size={15} className="flex-shrink-0" />
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-100 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedId || applyMutation.isPending || items.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applyMutation.isPending
                  ? <Icon icon={Loader2} size={14} className="animate-spin" />
                  : null}
                发起申请
                {!applyMutation.isPending
                  ? <Icon icon={ChevronRight} size={14} />
                  : null}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
