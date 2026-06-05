import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { clsx } from 'clsx'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/Button'
import { Pagination } from '@/components/Pagination'
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
        <DialogPanel className="w-full max-w-md rounded-xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <DialogTitle className="text-base font-semibold text-gray-800">
              审核会员
            </DialogTitle>
            <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5">
            {/* member info */}
            <div className="mb-5 rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-800">{member.name}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                <span>行业：{member.industry || '—'}</span>
                {member.province && <span>省份：{member.province}</span>}
                <span>注册时间：{member.createdAt?.slice(0, 10) ?? '—'}</span>
              </div>
            </div>

            {/* action radio */}
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-700">审核结果</p>
              <div className="flex gap-4">
                <label className={clsx(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors',
                  action === 'APPROVE'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}>
                  <input
                    type="radio"
                    value="APPROVE"
                    {...register('action')}
                    className="accent-emerald-500"
                  />
                  ✓ 通过
                </label>
                <label className={clsx(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors',
                  action === 'REJECT'
                    ? 'border-red-400 bg-red-50 text-red-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}>
                  <input
                    type="radio"
                    value="REJECT"
                    {...register('action')}
                    className="accent-red-500"
                  />
                  ✕ 拒绝
                </label>
              </div>
            </div>

            {/* remark */}
            <div className="mb-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                审核意见
                {action === 'REJECT' && <span className="ml-1 text-red-500">*</span>}
              </label>
              <textarea
                rows={3}
                placeholder={action === 'REJECT' ? '拒绝原因（必填）' : '可选，填写说明'}
                className={clsx(
                  'w-full resize-none rounded-lg border px-3 py-2 text-sm placeholder-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500',
                  errors.remark ? 'border-red-400' : 'border-gray-200'
                )}
                {...register('remark', {
                  validate: (val, fv) =>
                    fv.action === 'REJECT' && !val.trim() ? '拒绝时必须填写审核意见' : true,
                })}
              />
              {errors.remark && (
                <p className="mt-1 text-xs text-red-500">{errors.remark.message}</p>
              )}
            </div>

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
          <h1 className="text-xl font-semibold text-gray-800">会员审核</h1>
          <p className="mt-0.5 text-sm text-gray-400">处理待审核会员申请</p>
        </div>
        {total > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
            {total} 待审
          </span>
        )}
      </div>

      {/* table */}
      <div className="rounded-xl border border-gray-100 bg-white">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="mb-2 text-3xl">✅</span>
            <p className="text-sm text-gray-500">暂无待审核会员</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">序号</th>
                  <th className="px-4 py-3 font-medium">单位名称</th>
                  <th className="px-4 py-3 font-medium">行业</th>
                  <th className="px-4 py-3 font-medium">省份</th>
                  <th className="px-4 py-3 font-medium">申请等级</th>
                  <th className="px-4 py-3 font-medium">申请时间</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-amber-50/40">
                    <td className="px-4 py-3 text-gray-400">{(page - 1) * 20 + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.logoUrl ? (
                          <img src={m.logoUrl} alt="" className="h-7 w-7 shrink-0 rounded object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-amber-50 text-xs font-bold text-amber-600">
                            {m.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-gray-800">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.industry || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{m.province ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        m.memberLevel === 3
                          ? 'bg-brand-100 text-brand-700'
                          : m.memberLevel === 2
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      )}>
                        {m.memberLevelName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{m.createdAt?.slice(0, 10) ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        className="rounded-lg border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
                        onClick={() => setAuditMember(m)}
                      >
                        审核
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 && (
          <div className="px-4 pb-4">
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
