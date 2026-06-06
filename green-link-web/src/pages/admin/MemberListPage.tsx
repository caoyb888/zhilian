import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/Button'
import { Pagination } from '@/components/Pagination'
import {
  useAdminMemberList,
  useMemberDetail,
  useUpdateMemberStatus,
} from '@/services/memberAdminService'
import type { MemberItem, MemberDetailItem } from '@/types/api'

// ─── badge helpers ────────────────────────────────────────────────────────────

const STATUS_MAP: Record<number, { label: string; cls: string }> = {
  0: { label: '禁用', cls: 'bg-red-100 text-red-700' },
  1: { label: '正常', cls: 'bg-emerald-100 text-emerald-700' },
  2: { label: '审核中', cls: 'bg-amber-100 text-amber-700' },
}

const LEVEL_MAP: Record<number, { label: string; cls: string }> = {
  1: { label: '普通', cls: 'bg-gray-100 text-gray-600' },
  2: { label: 'VIP', cls: 'bg-amber-100 text-amber-700' },
  3: { label: '理事', cls: 'bg-brand-100 text-brand-700' },
}

function StatusBadge({ status }: { status: number }) {
  const m = STATUS_MAP[status] ?? { label: String(status), cls: 'bg-gray-100 text-gray-500' }
  return <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', m.cls)}>{m.label}</span>
}

function LevelBadge({ level }: { level: number }) {
  const m = LEVEL_MAP[level] ?? { label: String(level), cls: 'bg-gray-100 text-gray-500' }
  return <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', m.cls)}>{m.label}</span>
}

// ─── detail modal ─────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-3 gap-2 py-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="col-span-2 text-gray-800">{value}</span>
    </div>
  )
}

function DetailModal({ memberId, onClose }: { memberId: number; onClose: () => void }) {
  const { data, isLoading } = useMemberDetail(memberId)

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <DialogTitle className="text-base font-semibold text-gray-800">会员详情</DialogTitle>
            <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : data ? (
              <DetailContent detail={data} />
            ) : (
              <p className="text-center text-sm text-gray-400">加载失败</p>
            )}
          </div>
          <div className="flex justify-end border-t border-gray-100 px-6 py-4">
            <Button variant="secondary" size="sm" onClick={onClose}>关闭</Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

function DetailContent({ detail }: { detail: MemberDetailItem }) {
  return (
    <div className="divide-y divide-gray-50">
      <div className="pb-4">
        <div className="flex items-center gap-3">
          {detail.logoUrl && (
            <img src={detail.logoUrl} alt="logo" className="h-12 w-12 rounded-lg object-cover" />
          )}
          <div>
            <h3 className="font-semibold text-gray-800">{detail.name}</h3>
            {detail.shortName && <p className="text-xs text-gray-400">{detail.shortName}</p>}
          </div>
        </div>
      </div>
      <div className="py-1">
        <DetailRow label="会员等级" value={<LevelBadge level={detail.memberLevel} />} />
        <DetailRow label="状态" value={<StatusBadge status={detail.status} />} />
        <DetailRow label="行业" value={detail.industry} />
        <DetailRow
          label="所在地"
          value={[detail.province, detail.city].filter(Boolean).join(' · ') || null}
        />
        {detail.isCertified && (
          <DetailRow label="绿色认证" value={<span className="text-xs text-emerald-600">已认证</span>} />
        )}
        <DetailRow label="入会日期" value={detail.joinDate} />
      </div>
      {detail.introduction && (
        <div className="py-3">
          <p className="mb-1 text-xs text-gray-500">简介</p>
          <p className="text-sm text-gray-700 leading-relaxed">{detail.introduction}</p>
        </div>
      )}
      <div className="py-1">
        <DetailRow label="联系人" value={detail.contactName} />
        <DetailRow label="联系电话" value={detail.contactPhone} />
        <DetailRow label="邮箱" value={detail.contactEmail} />
      </div>
      {detail.tags.length > 0 && (
        <div className="pt-3">
          <p className="mb-2 text-xs text-gray-500">标签</p>
          <div className="flex flex-wrap gap-1">
            {detail.tags.map((t) => (
              <span key={t.id} className="rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── status toggle modal ──────────────────────────────────────────────────────

function ToggleStatusModal({
  member,
  onClose,
}: {
  member: MemberItem
  onClose: () => void
}) {
  const mutation = useUpdateMemberStatus()
  const targetStatus = member.status === 1 ? 0 : 1
  const actionLabel = targetStatus === 0 ? '禁用' : '启用'

  function handleConfirm() {
    mutation.mutate(
      { memberId: member.id, status: targetStatus as 0 | 1 },
      { onSuccess: onClose }
    )
  }

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
          <DialogTitle className="mb-2 text-base font-semibold text-gray-800">
            确认{actionLabel}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            确认要<span className={targetStatus === 0 ? 'text-red-600' : 'text-emerald-600'}>
              {actionLabel}
            </span>会员单位「{member.name}」吗？
          </p>
          {mutation.error && (
            <p className="mt-2 text-xs text-red-500">操作失败，请重试</p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>取消</Button>
            <Button
              variant={targetStatus === 0 ? 'danger' : 'primary'}
              size="sm"
              loading={mutation.isPending}
              onClick={handleConfirm}
            >
              确认{actionLabel}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function MemberListPage() {
  const isSuperAdmin = useAuthStore((s) => s.accountInfo?.roles.includes('SUPER_ADMIN') ?? false)

  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [filterStatus, setFilterStatus] = useState<number | undefined>(undefined)
  const [filterLevel, setFilterLevel] = useState<number | undefined>(undefined)

  const [searchKeyword, setSearchKeyword] = useState('')
  const [appliedStatus, setAppliedStatus] = useState<number | undefined>(undefined)
  const [appliedLevel, setAppliedLevel] = useState<number | undefined>(undefined)

  const [detailId, setDetailId] = useState<number | null>(null)
  const [toggleMember, setToggleMember] = useState<MemberItem | null>(null)

  const { data, isLoading } = useAdminMemberList({
    page,
    size: 20,
    keyword: searchKeyword || undefined,
    status: appliedStatus,
    memberLevel: appliedLevel,
  })

  function handleSearch() {
    setSearchKeyword(keyword)
    setAppliedStatus(filterStatus)
    setAppliedLevel(filterLevel)
    setPage(1)
  }

  function handleReset() {
    setKeyword('')
    setFilterStatus(undefined)
    setFilterLevel(undefined)
    setSearchKeyword('')
    setAppliedStatus(undefined)
    setAppliedLevel(undefined)
    setPage(1)
  }

  const records = data?.records ?? []
  const total = data?.total ?? 0

  return (
    <div className="flex flex-col gap-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">会员管理</h1>
          <p className="mt-0.5 text-sm text-gray-400">管理协会全部会员单位</p>
        </div>
        {total > 0 && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
            共 {total} 家
          </span>
        )}
      </div>

      {/* filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">关键词</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="单位名称 / 行业"
            className="w-48 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">状态</label>
          <select
            value={filterStatus ?? ''}
            onChange={(e) => setFilterStatus(e.target.value === '' ? undefined : Number(e.target.value))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">全部状态</option>
            <option value="1">正常</option>
            <option value="2">审核中</option>
            <option value="0">禁用</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">会员等级</label>
          <select
            value={filterLevel ?? ''}
            onChange={(e) => setFilterLevel(e.target.value === '' ? undefined : Number(e.target.value))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">全部等级</option>
            <option value="1">普通会员</option>
            <option value="2">VIP 会员</option>
            <option value="3">理事单位</option>
          </select>
        </div>
        <Button size="sm" onClick={handleSearch}>搜索</Button>
        <Button variant="ghost" size="sm" onClick={handleReset}>重置</Button>
      </div>

      {/* table */}
      <div className="rounded-xl border border-gray-100 bg-white">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">暂无会员数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">序号</th>
                  <th className="px-4 py-3 font-medium">单位名称</th>
                  <th className="px-4 py-3 font-medium">行业</th>
                  <th className="px-4 py-3 font-medium">等级</th>
                  <th className="px-4 py-3 font-medium">省/市</th>
                  <th className="px-4 py-3 font-medium">认证</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">注册时间</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-400">
                      {(page - 1) * 20 + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.logoUrl ? (
                          <img src={m.logoUrl} alt="" className="h-7 w-7 shrink-0 rounded object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-brand-50 text-xs font-bold text-brand-600">
                            {m.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">{m.name}</p>
                          {m.shortName && <p className="text-xs text-gray-400">{m.shortName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.industry || '—'}</td>
                    <td className="px-4 py-3">
                      <LevelBadge level={m.memberLevel} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {[m.province, m.city].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {m.isCertified ? (
                        <span className="text-xs text-emerald-600">✓ 已认证</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {m.createdAt?.slice(0, 10) ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="text-brand-600 hover:underline"
                          onClick={() => setDetailId(m.id)}
                        >
                          详情
                        </button>
                        {isSuperAdmin && m.status !== 2 && (
                          <button
                            className={clsx(
                              'hover:underline',
                              m.status === 1 ? 'text-red-500' : 'text-emerald-600'
                            )}
                            onClick={() => setToggleMember(m)}
                          >
                            {m.status === 1 ? '禁用' : '启用'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* pagination */}
        {total > 0 && (
          <div className="px-4 pb-4">
            <Pagination page={page} total={total} size={20} onChange={setPage} />
          </div>
        )}
      </div>

      {/* modals */}
      {detailId !== null && (
        <DetailModal memberId={detailId} onClose={() => setDetailId(null)} />
      )}
      {toggleMember !== null && (
        <ToggleStatusModal member={toggleMember} onClose={() => setToggleMember(null)} />
      )}
    </div>
  )
}
