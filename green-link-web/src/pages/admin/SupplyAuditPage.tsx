import { useState } from 'react'
import {
  Search,
  Filter,
  Download,
  Pencil,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { EmptyState } from '@/components/states/EmptyState'
import { SkeletonList } from '@/components/states/SkeletonList'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'

// Placeholder data until backend S3 implementation
const MOCK_RECORDS: {
  id: number
  title: string
  type: string
  memberName: string
  submitTime: string
  auditStatus: number
}[] = []

export default function SupplyAuditPage() {
  const [keyword, setKeyword] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [isLoading] = useState(false)

  const records = MOCK_RECORDS
  const total = records.length

  return (
    <div className="flex flex-col gap-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-theme-text-main">资源审核</h1>
          <p className="mt-0.5 text-sm text-theme-text-muted">审核会员发布的资源与需求信息</p>
        </div>
        {total > 0 && (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">
            共 {total} 条
          </span>
        )}
      </div>

      {/* filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-stone-100 bg-white p-4 shadow-card">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-stone-500">关键词</label>
          <div className="relative">
            <Icon
              icon={Search}
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="标题 / 单位名称"
              className="w-48 rounded-lg border border-stone-200 bg-theme-surface py-1.5 pl-9 pr-3 text-sm text-theme-text-main transition-all duration-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-stone-500">类型</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-stone-200 bg-theme-surface px-3 py-1.5 text-sm text-theme-text-main transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
          >
            <option value="">全部类型</option>
            <option value="RESOURCE">资源</option>
            <option value="DEMAND">需求</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-stone-500">审核状态</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-stone-200 bg-theme-surface px-3 py-1.5 text-sm text-theme-text-main transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent"
          >
            <option value="">全部状态</option>
            <option value="0">待审核</option>
            <option value="1">已通过</option>
            <option value="2">已拒绝</option>
          </select>
        </div>
        <Button size="sm">
          <Icon icon={Filter} size={14} />
          搜索
        </Button>
        <Button variant="ghost" size="sm">
          重置
        </Button>
        <Button variant="secondary" size="sm" className="ml-auto">
          <Icon icon={Download} size={14} />
          导出
        </Button>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        {isLoading ? (
          <div className="p-4">
            <SkeletonList count={5} />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="暂无待审核资源"
            description="当前没有需要审核的资源或需求信息"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">
                <tr>
                  <th className="px-4 py-3">标题</th>
                  <th className="px-4 py-3">类型</th>
                  <th className="px-4 py-3">发布单位</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      提交时间
                      <Icon icon={ArrowUpDown} size={12} className="text-stone-400" />
                    </span>
                  </th>
                  <th className="px-4 py-3">审核状态</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-stone-100 transition-colors hover:bg-stone-50/80"
                  >
                    <td className="px-4 py-3 font-medium text-stone-800">{r.title}</td>
                    <td className="px-4 py-3 text-sm text-stone-500">{r.type}</td>
                    <td className="px-4 py-3 text-sm text-stone-500">{r.memberName}</td>
                    <td className="px-4 py-3 text-sm text-stone-500">{r.submitTime}</td>
                    <td className="px-4 py-3">
                      {r.auditStatus === 0 && <Badge variant="warning">待审核</Badge>}
                      {r.auditStatus === 1 && <Badge variant="success">已通过</Badge>}
                      {r.auditStatus === 2 && <Badge variant="error">已拒绝</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1 rounded-lg border border-stone-200 p-0.5">
                        <button
                          className="rounded p-1.5 text-stone-500 transition-all duration-200 hover:bg-stone-100 hover:text-theme-accent"
                          title="审核"
                        >
                          <Icon icon={Pencil} size={14} />
                        </button>
                        <button
                          className="rounded p-1.5 text-emerald-600 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700"
                          title="通过"
                        >
                          <Icon icon={CheckCircle2} size={14} />
                        </button>
                        <button
                          className="rounded p-1.5 text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                          title="拒绝"
                        >
                          <Icon icon={XCircle} size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
