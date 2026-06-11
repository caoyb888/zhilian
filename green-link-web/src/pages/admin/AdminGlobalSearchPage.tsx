import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Building2, Layers, FileSearch, ChevronRight, X, type LucideIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import http from '@/services/http'
import { RESOURCE_TYPE_LABELS, DEMAND_TYPE_LABELS } from '@/services/supplyService'
import { Icon } from '@/components/Icon'
import { Spinner } from '@/components/Spinner'
import type { ApiResult, PageData, MemberItem } from '@/types/api'
import type { ResourceItem, DemandItem } from '@/services/supplyService'

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_LENGTH = 2
const OVERVIEW_SIZE = 5
const DETAIL_SIZE = 20

const TABS = [
  { key: 'all',      label: '全部' },
  { key: 'member',   label: '会员' },
  { key: 'resource', label: '资源' },
  { key: 'demand',   label: '需求' },
] as const

type TabKey = (typeof TABS)[number]['key']

const AUDIT_LABELS: Record<number, string> = {
  0: '待审核',
  1: '已通过',
  2: '已拒绝',
  3: '已下架',
}

const AUDIT_COLORS: Record<number, string> = {
  0: 'text-amber-600 bg-amber-50',
  1: 'text-emerald-600 bg-emerald-50',
  2: 'text-red-600 bg-red-50',
  3: 'text-stone-500 bg-stone-100',
}

const MEMBER_LEVEL_LABELS: Record<number, string> = {
  1: '普通会员',
  2: 'VIP 会员',
  3: '理事单位',
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useMemberSearch(keyword: string, size: number) {
  return useQuery({
    queryKey: ['admin', 'search', 'members', keyword, size],
    queryFn: async () => {
      const res = await http.get<ApiResult<PageData<MemberItem>>>('/members', {
        params: { keyword, page: 1, size },
      })
      return res.data.data
    },
    enabled: keyword.length >= MIN_LENGTH,
    staleTime: 30_000,
  })
}

function useResourceSearch(keyword: string, size: number) {
  return useQuery({
    queryKey: ['admin', 'search', 'resources', keyword, size],
    queryFn: async () => {
      const res = await http.get<ApiResult<PageData<ResourceItem>>>('/supply/resources', {
        params: { keyword, page: 1, size },
      })
      return res.data.data
    },
    enabled: keyword.length >= MIN_LENGTH,
    staleTime: 30_000,
  })
}

function useDemandSearch(keyword: string, size: number) {
  return useQuery({
    queryKey: ['admin', 'search', 'demands', keyword, size],
    queryFn: async () => {
      const res = await http.get<ApiResult<PageData<DemandItem>>>('/supply/demands', {
        params: { keyword, page: 1, size },
      })
      return res.data.data
    },
    enabled: keyword.length >= MIN_LENGTH,
    staleTime: 30_000,
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

function SectionHeader({
  icon: IconComp,
  title,
  total,
  onViewAll,
}: {
  icon: LucideIcon
  title: string
  total: number
  onViewAll?: () => void
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon icon={IconComp} size={16} className="text-stone-500" />
        <span className="text-sm font-semibold text-stone-700">{title}</span>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">{total}</span>
      </div>
      {onViewAll && total > OVERVIEW_SIZE && (
        <button
          onClick={onViewAll}
          className="flex items-center gap-0.5 text-xs text-emerald-600 hover:text-emerald-700"
        >
          查看全部 <Icon icon={ChevronRight} size={13} />
        </button>
      )}
    </div>
  )
}

function MemberCard({ item, navigate }: { item: MemberItem; navigate: (path: string) => void }) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-xl border border-stone-100 bg-white p-4 text-left shadow-card transition-all hover:border-emerald-200 hover:shadow-card-hover"
      onClick={() => navigate(`/admin/members`)}
    >
      {item.logoUrl ? (
        <img src={item.logoUrl} className="h-10 w-10 rounded-lg object-cover" alt="" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 text-sm font-bold">
          {item.name.slice(0, 1)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-stone-800">{item.name}</span>
          {item.memberLevel > 1 && (
            <Badge
              label={MEMBER_LEVEL_LABELS[item.memberLevel] ?? ''}
              className="text-violet-600 bg-violet-50"
            />
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-stone-500">{item.industry}</p>
      </div>
      <div className="shrink-0 text-xs text-stone-400">
        {item.province ?? '—'}
      </div>
    </button>
  )
}

function ResourceCard({ item, navigate }: { item: ResourceItem; navigate: (path: string) => void }) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-xl border border-stone-100 bg-white p-4 text-left shadow-card transition-all hover:border-emerald-200 hover:shadow-card-hover"
      onClick={() => navigate(`/supply/resources/${item.id}`)}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
        <Icon icon={Layers} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="truncate text-sm font-medium text-stone-800"
            dangerouslySetInnerHTML={{ __html: item.highlightTitle ?? item.title }}
          />
          <Badge
            label={RESOURCE_TYPE_LABELS[item.type] ?? item.type}
            className="shrink-0 text-sky-600 bg-sky-50"
          />
        </div>
        {(item.highlightSummary ?? item.summary) && (
          <p
            className="mt-0.5 truncate text-xs text-stone-500"
            dangerouslySetInnerHTML={{ __html: item.highlightSummary ?? item.summary ?? '' }}
          />
        )}
      </div>
      <div className="ml-2 shrink-0">
        <Badge
          label={AUDIT_LABELS[item.auditStatus] ?? ''}
          className={AUDIT_COLORS[item.auditStatus] ?? ''}
        />
      </div>
    </button>
  )
}

function DemandCard({ item, navigate }: { item: DemandItem; navigate: (path: string) => void }) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-xl border border-stone-100 bg-white p-4 text-left shadow-card transition-all hover:border-emerald-200 hover:shadow-card-hover"
      onClick={() => navigate(`/supply/demands/${item.id}`)}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
        <Icon icon={FileSearch} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="truncate text-sm font-medium text-stone-800"
            dangerouslySetInnerHTML={{ __html: item.highlightTitle ?? item.title }}
          />
          <Badge
            label={DEMAND_TYPE_LABELS[item.type] ?? item.type}
            className="shrink-0 text-amber-600 bg-amber-50"
          />
        </div>
        {(item.highlightSummary ?? item.summary) && (
          <p
            className="mt-0.5 truncate text-xs text-stone-500"
            dangerouslySetInnerHTML={{ __html: item.highlightSummary ?? item.summary ?? '' }}
          />
        )}
      </div>
      <div className="ml-2 shrink-0">
        <Badge
          label={AUDIT_LABELS[item.auditStatus] ?? ''}
          className={AUDIT_COLORS[item.auditStatus] ?? ''}
        />
      </div>
    </button>
  )
}

function EmptyResults({ keyword }: { keyword: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-stone-400">
      <Icon icon={Search} size={40} className="opacity-30" />
      <p className="text-sm">未找到与「{keyword}」相关的结果</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminGlobalSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const initialQ = searchParams.get('q') ?? ''
  const initialTab = (searchParams.get('tab') as TabKey | null) ?? 'all'

  const [inputValue, setInputValue] = useState(initialQ)
  const [keyword, setKeyword] = useState(initialQ)
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const detailSize = activeTab === 'all' ? OVERVIEW_SIZE : DETAIL_SIZE

  const memberQuery  = useMemberSearch(keyword, activeTab === 'member'  ? DETAIL_SIZE : OVERVIEW_SIZE)
  const resourceQuery = useResourceSearch(keyword, activeTab === 'resource' ? DETAIL_SIZE : OVERVIEW_SIZE)
  const demandQuery  = useDemandSearch(keyword, activeTab === 'demand'  ? DETAIL_SIZE : OVERVIEW_SIZE)

  const isAnyLoading = memberQuery.isLoading || resourceQuery.isLoading || demandQuery.isLoading

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setKeyword(inputValue.trim())
      const params: Record<string, string> = {}
      if (inputValue.trim()) params.q = inputValue.trim()
      if (activeTab !== 'all') params.tab = activeTab
      setSearchParams(params, { replace: true })
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [inputValue, activeTab, setSearchParams])

  // keep url in sync when tab changes
  useEffect(() => {
    const params: Record<string, string> = {}
    if (keyword) params.q = keyword
    if (activeTab !== 'all') params.tab = activeTab
    setSearchParams(params, { replace: true })
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  function switchTab(tab: TabKey) {
    setActiveTab(tab)
  }

  const members   = memberQuery.data?.records ?? []
  const resources = resourceQuery.data?.records ?? []
  const demands   = demandQuery.data?.records ?? []
  const memberTotal   = memberQuery.data?.total ?? 0
  const resourceTotal = resourceQuery.data?.total ?? 0
  const demandTotal   = demandQuery.data?.total ?? 0

  const hasResults = members.length + resources.length + demands.length > 0
  const searched = keyword.length >= MIN_LENGTH

  return (
    <div className="flex flex-col gap-6">
      {/* 页头 */}
      <div>
        <h1 className="text-xl font-semibold text-theme-text-main">全局搜索</h1>
        <p className="mt-1 text-sm text-theme-text-muted">搜索会员单位、供给资源、需求信息</p>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Icon
          icon={Search}
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="输入关键词搜索（至少 2 个字）"
          autoFocus
          className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-10 pr-10 text-sm text-stone-800 shadow-card outline-none transition-colors placeholder:text-stone-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
        {inputValue && (
          <button
            onClick={() => { setInputValue(''); setKeyword('') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            aria-label="清空"
          >
            <Icon icon={X} size={15} />
          </button>
        )}
      </div>

      {/* Tab 切换 */}
      {searched && (
        <div className="flex gap-1 border-b border-stone-200">
          {TABS.map((t) => {
            const count =
              t.key === 'member'   ? memberTotal :
              t.key === 'resource' ? resourceTotal :
              t.key === 'demand'   ? demandTotal :
              memberTotal + resourceTotal + demandTotal
            return (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={
                  'flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ' +
                  (activeTab === t.key
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-stone-500 hover:text-stone-800')
                }
              >
                {t.label}
                {count > 0 && (
                  <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-xs leading-none text-stone-500">
                    {count > 999 ? '999+' : count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* 结果区 */}
      {!searched ? (
        <div className="flex flex-col items-center gap-3 py-16 text-stone-400">
          <Icon icon={Search} size={48} className="opacity-20" />
          <p className="text-sm">请输入至少 2 个字开始搜索</p>
        </div>
      ) : isAnyLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" className="text-emerald-500" />
        </div>
      ) : !hasResults ? (
        <EmptyResults keyword={keyword} />
      ) : (
        <div className="flex flex-col gap-6">
          {/* 会员 */}
          {(activeTab === 'all' || activeTab === 'member') && members.length > 0 && (
            <section>
              <SectionHeader
                icon={Building2}
                title="会员单位"
                total={memberTotal}
                onViewAll={activeTab === 'all' ? () => switchTab('member') : undefined}
              />
              <div className="flex flex-col gap-2">
                {members.map((m) => (
                  <MemberCard key={m.id} item={m} navigate={navigate} />
                ))}
              </div>
            </section>
          )}

          {/* 资源 */}
          {(activeTab === 'all' || activeTab === 'resource') && resources.length > 0 && (
            <section>
              <SectionHeader
                icon={Layers}
                title="供给资源"
                total={resourceTotal}
                onViewAll={activeTab === 'all' ? () => switchTab('resource') : undefined}
              />
              <div className="flex flex-col gap-2">
                {resources.map((r) => (
                  <ResourceCard key={r.id} item={r} navigate={navigate} />
                ))}
              </div>
            </section>
          )}

          {/* 需求 */}
          {(activeTab === 'all' || activeTab === 'demand') && demands.length > 0 && (
            <section>
              <SectionHeader
                icon={FileSearch}
                title="供需需求"
                total={demandTotal}
                onViewAll={activeTab === 'all' ? () => switchTab('demand') : undefined}
              />
              <div className="flex flex-col gap-2">
                {demands.map((d) => (
                  <DemandCard key={d.id} item={d} navigate={navigate} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* 分页提示（单 tab 详情模式） */}
      {searched && activeTab !== 'all' && (
        (() => {
          const total =
            activeTab === 'member'   ? memberTotal :
            activeTab === 'resource' ? resourceTotal : demandTotal
          if (total > detailSize) {
            return (
              <p className="text-center text-xs text-stone-400">
                共 {total} 条，当前显示前 {detailSize} 条，请缩短关键词以获取更精确结果
              </p>
            )
          }
          return null
        })()
      )}
    </div>
  )
}
