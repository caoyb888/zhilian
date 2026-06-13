import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { clsx } from 'clsx'
import { X, Check, CheckCircle2, ArrowUpDown } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { SkeletonList } from '@/components/states/SkeletonList'
import { EmptyState } from '@/components/states/EmptyState'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Pagination } from '@/components/Pagination'
import { FormField } from '@/components/FormField'
import { useAdminMemberList, useAuditMember } from '@/services/memberAdminService'
import type { MemberItem } from '@/types/api'

// ─── audit form types ─────────────────────────────────────────────────────────

interface AuditFormData {
  action: 'APPROVE' | 'REJECT'
  remark: string
}

// ─── audit modal ──────────────────────────────────────────────────────────────

function AuditModal({ member, onClose }: { member: MemberItem; onClose: () => void }) {
  const mutation = useAuditMember()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AuditFormData>({ defaultValues: { action: 'APPROVE', remark: '' } })

  const action = watch('action')

  function onSubmit(data: AuditFormData) {
    mutation.mutate(
      { memberId: member.id, action: data.action, remark: data.remark.trim() || undefined },
      { onSuccess: onClose }
    )
  }

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-slate-800/60 px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-100">
              审核会员
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
            {/* member info */}
            <div className="mb-5 rounded-lg bg-slate-800/40 p-4">
              <p className="text-sm font-medium text-slate-100">{member.name}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                <span>行业：{member.industry || '—'}</span>
                {member.province && <span>省份：{member.province}</span>}
                <span>注册时间：{member.createdAt?.slice(0, 10) ?? '—'}</span>
              </div>
            </div>

            {/* action radio */}
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-slate-300">审核结果</p>
              <div className="flex gap-4">
                <label className={clsx(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all duration-200',
                  action === 'APPROVE'
                    ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-400'
                    : 'border-slate-700/60 text-slate-400 hover:border-slate-600'
                )}>
                  <input
                    type="radio"
                    value="APPROVE"
                    {...register('action')}
                    className="accent-emerald-500"
                  />
                  <span className="inline-flex items-center gap-1"><Icon icon={Check} size={16} />通过</span>
                </label>
                <label className={clsx(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all duration-200',
                  action === 'REJECT'
                    ? 'border-red-500/60 bg-red-950/40 text-red-400'
                    : 'border-slate-700/60 text-slate-400 hover:border-slate-600'
                )}>
                  <input
                    type="radio"
                    value="REJECT"
                    {...register('action')}
                    className="accent-red-500"
                  />
                  <span className="inline-flex items-center gap-1"><Icon icon={X} size={16} />拒绝</span>
                </label>
              </div>
            </div>

            {/* remark */}
            <FormField
              label="审核意见"
              required={action === 'REJECT'}
              error={errors.remark?.message}
            >
              <textarea
                rows={3}
                placeholder={action === 'REJECT' ? '拒绝原因（必填）' : '可选，填写说明'}
                className={clsx(
                  'w-full resize-none rounded-lg border px-3 py-2 text-sm placeholder-slate-600 bg-slate-800/60 text-slate-200 transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-theme-accent/20',
                  errors.remark ? 'border-red-300 focus:border-red-400' : 'border-slate-700/60 hover:border-slate-600 focus:border-emerald-500/50'
                )}
                {...register('remark', {
                  validate: (val, fv) =>
                    fv.action === 'REJECT' && !val.trim() ? '拒绝时必须填写审核意见' : true,
                })}
              />
            </FormField>

            {mutation.error && (
              <p className="mt-2 text-xs text-red-500">提交失败，请重试</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                取消
              </Button>
              <Button
                variant={action === 'APPROVE' ? 'primary' : 'danger'}
                size="sm"
                type="submit"
                loading={mutation.isPending}
              >
                {action === 'APPROVE' ? '通过审核' : '拒绝申请'}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function MemberAuditPage() {
  const [page, setPage] = useState(1)
  const [auditMember, setAuditMember] = useState<MemberItem | null>(null)

  const { data, isLoading } = useAdminMemberList({
    page,
    size: 20,
    status: 2,
  })

  const records = data?.records ?? []
  const total = data?.total ?? 0

  return (
    <div className="flex flex-col gap-4">
      {/* header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold text-theme-text-main">会员审核</h1>
          <p className="mt-0.5 text-sm text-theme-text-muted">处理待审核会员申请</p>
        </div>
        {total > 0 && (
          <Badge variant="warning">{total} 待审</Badge>
        )}
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/80">
        {isLoading ? (
          <div className="p-4">
            <SkeletonList count={5} />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="暂无待审核会员"
            description="当前没有待审核的会员申请"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">序号</th>
                  <th className="px-4 py-3">单位名称</th>
                  <th className="px-4 py-3">行业</th>
                  <th className="px-4 py-3">省份</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      申请等级
                      <Icon icon={ArrowUpDown} size={12} className="text-slate-500" />
                    </span>
                  </th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      申请时间
                      <Icon icon={ArrowUpDown} size={12} className="text-slate-500" />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((m, idx) => (
                  <tr
                    key={m.id}
                    className="border-t border-slate-800/60 transition-colors hover:bg-slate-800/40/80"
                  >
                    <td className="px-4 py-3 text-sm text-slate-500">{(page - 1) * 20 + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.logoUrl ? (
                          <img src={m.logoUrl} alt="" className="h-7 w-7 shrink-0 rounded object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-amber-950/50 text-xs font-bold text-amber-400">
                            {m.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-slate-100">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-200">{m.industry || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{m.province ?? '—'}</td>
                    <td className="px-4 py-3">
                      {m.memberLevel === 3 ? (
                        <Badge variant="news">理事</Badge>
                      ) : m.memberLevel === 2 ? (
                        <Badge variant="vip">VIP</Badge>
                      ) : (
                        <Badge variant="default">普通</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{m.createdAt?.slice(0, 10) ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="border-amber-700/50 bg-amber-950/40 text-amber-400 hover:bg-amber-900/50"
                        onClick={() => setAuditMember(m)}
                      >
                        审核
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 && (
          <div className="border-t border-slate-800/60 px-4 py-4">
            <Pagination page={page} total={total} size={20} onChange={setPage} />
          </div>
        )}
      </div>

      {auditMember !== null && (
        <AuditModal member={auditMember} onClose={() => setAuditMember(null)} />
      )}
    </div>
  )
}
