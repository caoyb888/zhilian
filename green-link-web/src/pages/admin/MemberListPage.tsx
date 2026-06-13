import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { clsx } from 'clsx'
import {
  X,
  CheckCircle2,
  Search,
  Filter,
  Download,
  Pencil,
  ArrowUpDown,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { useAuthStore } from '@/stores/authStore'
import { SkeletonList } from '@/components/states/SkeletonList'
import { EmptyState } from '@/components/states/EmptyState'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Pagination } from '@/components/Pagination'
import {
  useAdminMemberList,
  useMemberDetail,
  useUpdateMemberStatus,
} from '@/services/memberAdminService'
import type { MemberItem, MemberDetailItem } from '@/types/api'

// ─── badge helpers ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: number }) {
  if (status === 0) return <Badge variant="error">禁用</Badge>
  if (status === 1) return <Badge variant="success">正常</Badge>
  if (status === 2) return <Badge variant="warning">审核中</Badge>
  return <Badge variant="default">{status}</Badge>
}

function LevelBadge({ level }: { level: number }) {
  if (level === 3) return <Badge variant="news">理事</Badge>
  if (level === 2) return <Badge variant="vip">VIP</Badge>
  return <Badge variant="default">普通</Badge>
}

// ─── detail modal ─────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-3 gap-2 py-2 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="col-span-2 text-slate-100">{value}</span>
    </div>
  )
}

function DetailModal({ memberId, onClose }: { memberId: number; onClose: () => void }) {
  const { data, isLoading } = useMemberDetail(memberId)

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-slate-800/60 px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-100">会员详情</DialogTitle>
            <button
              className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-700/60 hover:text-slate-200"
              onClick={onClose}
              aria-label="关闭"
            >
              <Icon icon={X} size={18} />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
            {isLoading ? (
              <SkeletonList count={4} />
            ) : data ? (
              <DetailContent detail={data} />
            ) : (
              <EmptyState title="加载失败" description="无法获取会员详情，请稍后重试" />
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-800/60 px-6 py-4">
            <Button variant="secondary" size="sm" onClick={onClose}>关闭</Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

function DetailContent({ detail }: { detail: MemberDetailItem }) {
  return (
    <div className="divide-y divide-slate-800/60">
      <div className="pb-4">
        <div className="flex items-center gap-3">
          {detail.logoUrl && (
            <img src={detail.logoUrl} alt="logo" className="h-12 w-12 rounded-lg object-cover" />
          )}
          <div>
            <h3 className="font-semibold text-slate-100">{detail.name}</h3>
            {detail.shortName && <p className="text-xs text-slate-500">{detail.shortName}</p>}
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
          <p className="mb-1 text-xs text-slate-400">简介</p>
          <p className="text-sm leading-relaxed text-slate-200">{detail.introduction}</p>
        </div>
      )}
      <div className="py-1">
        <DetailRow label="联系人" value={detail.contactName} />
        <DetailRow label="联系电话" value={detail.contactPhone} />
        <DetailRow label="邮箱" value={detail.contactEmail} />
      </div>
      {detail.tags.length > 0 && (
        <div className="pt-3">
          <p className="mb-2 text-xs text-slate-400">标签</p>
          <div className="flex flex-wrap gap-1">
            {detail.tags.map((t) => (
              <span key={t.id} className="rounded bg-emerald-950/50 px-2 py-0.5 text-xs text-emerald-400">
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
        <DialogPanel className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-slate-800/60 px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-100">
              确认{actionLabel}
            </DialogTitle>
            <button
              className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-700/60 hover:text-slate-200"
              onClick={onClose}
              aria-label="关闭"
            >
              <Icon icon={X} size={18} />
            </button>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-slate-300">
              确认要
              <span className={targetStatus === 0 ? 'text-red-600' : 'text-emerald-600'}>
                {actionLabel}
              </span>
              会员单位「{member.name}」吗？
            </p>
            {mutation.error && (
              <p className="mt-2 text-xs text-red-500">操作失败，请重试</p>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-800/60 px-6 py-4">
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
          <h1 className="text-xl font-semibold text-theme-text-main">会员管理</h1>
          <p className="mt-0.5 text-sm text-theme-text-muted">管理协会全部会员单位</p>
        </div>
        {total > 0 && (
          <span className="rounded-full bg-slate-800/60 px-3 py-1 text-sm text-slate-300">
            共 {total} 家
          </span>
        )}
      </div>

      {/* filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-800/60 bg-slate-900/80 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">关键词</label>
          <div className="relative">
            <Icon
              icon={Search}
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="单位名称 / 行业"
              className="w-48 rounded-lg border border-slate-700/60 bg-slate-800/60 py-1.5 pl-9 pr-3 text-sm text-slate-200 transition-all duration-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">状态</label>
          <select
            value={filterStatus ?? ''}
            onChange={(e) => setFilterStatus(e.target.value === '' ? undefined : Number(e.target.value))}
            className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-sm text-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
          >
            <option value="">全部状态</option>
            <option value="1">正常</option>
            <option value="2">审核中</option>
            <option value="0">禁用</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">会员等级</label>
          <select
            value={filterLevel ?? ''}
            onChange={(e) => setFilterLevel(e.target.value === '' ? undefined : Number(e.target.value))}
            className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-sm text-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
          >
            <option value="">全部等级</option>
            <option value="1">普通会员</option>
            <option value="2">VIP 会员</option>
            <option value="3">理事单位</option>
          </select>
        </div>
        <Button size="sm" onClick={handleSearch}>
          <Icon icon={Filter} size={14} />
          搜索
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          重置
        </Button>
        <Button variant="secondary" size="sm" className="ml-auto">
          <Icon icon={Download} size={14} />
          导出
        </Button>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/80">
        {isLoading ? (
          <div className="p-4">
            <SkeletonList count={5} />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={Search}
            title="暂无会员数据"
            description="当前没有符合条件的会员单位"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">序号</th>
                  <th className="px-4 py-3">单位名称</th>
                  <th className="px-4 py-3">行业</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      等级
                      <Icon icon={ArrowUpDown} size={12} className="text-slate-500" />
                    </span>
                  </th>
                  <th className="px-4 py-3">省/市</th>
                  <th className="px-4 py-3">认证</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      状态
                      <Icon icon={ArrowUpDown} size={12} className="text-slate-500" />
                    </span>
                  </th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      注册时间
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
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {(page - 1) * 20 + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.logoUrl ? (
                          <img src={m.logoUrl} alt="" className="h-7 w-7 shrink-0 rounded object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-emerald-950/50 text-xs font-bold text-emerald-400">
                            {m.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-100">{m.name}</p>
                          {m.shortName && <p className="text-xs text-slate-500">{m.shortName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-200">{m.industry || '—'}</td>
                    <td className="px-4 py-3">
                      <LevelBadge level={m.memberLevel} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {[m.province, m.city].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {m.isCertified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <Icon icon={CheckCircle2} size={14} />
                          已认证
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {m.createdAt?.slice(0, 10) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 p-0.5">
                        <button
                          className="rounded p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-700/60 hover:text-emerald-400"
                          onClick={() => setDetailId(m.id)}
                          title="详情"
                        >
                          <Icon icon={Pencil} size={14} />
                        </button>
                        {isSuperAdmin && m.status !== 2 && (
                          <button
                            className={clsx(
                              'rounded p-1.5 transition-all duration-200 hover:bg-slate-800/60',
                              m.status === 1 ? 'text-red-500 hover:text-red-600' : 'text-emerald-600 hover:text-emerald-700'
                            )}
                            onClick={() => setToggleMember(m)}
                            title={m.status === 1 ? '禁用' : '启用'}
                          >
                            {m.status === 1 ? (
                              <Icon icon={X} size={14} />
                            ) : (
                              <Icon icon={CheckCircle2} size={14} />
                            )}
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
          <div className="border-t border-slate-800/60 px-4 py-4">
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
