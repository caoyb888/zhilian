import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import {
  Banknote, Building2, Calendar, RefreshCw, Search, SlidersHorizontal, X, Heart, Eye, MapPin,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Pagination } from '@/components/Pagination'
import { Spinner } from '@/components/Spinner'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { PortalNav } from '@/business/PortalNav'
import { useAuthStore } from '@/stores/authStore'
import {
  useDemandList,
  useFavoriteDemand,
  useUnfavoriteDemand,
  DEMAND_TYPE_LABELS,
  DEMAND_TYPES,
  PROVINCES,
  type DemandItem,
} from '@/services/supplyService'
import { fetchTagCategories, fetchTags, type Tag } from '@/services/tagService'
import { useQuery } from '@tanstack/react-query'

const PAGE_SIZE = 12

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Highlight({ html, fallback }: { html: string | null; fallback: string }) {
  if (!html) return <>{fallback}</>
  return (
    <span
      className="highlight"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, { ALLOWED_TAGS: ['em'] }) }}
    />
  )
}

function formatDate(s: string | null | undefined) {
  return s ? String(s).slice(0, 10) : ''
}

function formatBudget(min: number | null, max: number | null): string {
  if (!min && !max) return '面议'
  if (min && max) return `${min} – ${max} 万元`
  if (min) return `${min} 万元起`
  return `≤ ${max} 万元`
}

// ─── Type badge colors ────────────────────────────────────────────────────────

const TYPE_BADGE_CLASS: Record<string, string> = {
  PRODUCT: 'bg-orange-50 text-orange-700 border-orange-200',
  TECHNOLOGY: 'bg-blue-50 text-blue-700 border-blue-200',
  TALENT: 'bg-purple-50 text-purple-700 border-purple-200',
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DemandSkeletonCard() {
  return (
    <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-16 rounded bg-stone-100" />
        <div className="h-4 w-20 rounded bg-stone-100" />
      </div>
      <div className="h-4 w-full rounded bg-stone-100 mb-2" />
      <div className="h-4 w-4/5 rounded bg-stone-100 mb-3" />
      <div className="h-3 w-3/5 rounded bg-stone-100 mb-4" />
      <div className="flex gap-1 mb-4">
        <div className="h-5 w-12 rounded bg-stone-100" />
        <div className="h-5 w-14 rounded bg-stone-100" />
      </div>
      <div className="flex items-center justify-between border-t border-stone-100 pt-3">
        <div className="h-3 w-24 rounded bg-stone-100" />
        <div className="h-8 w-8 rounded-full bg-stone-100" />
      </div>
    </div>
  )
}

// ─── Demand Card ──────────────────────────────────────────────────────────────

interface DemandCardProps {
  demand: DemandItem
  isFavorited: boolean
  onFavorite: (id: number, favorited: boolean) => void
}

function DemandCard({ demand, isFavorited, onFavorite }: DemandCardProps) {
  const typeLabel = DEMAND_TYPE_LABELS[demand.type] ?? demand.type
  const badgeClass = TYPE_BADGE_CLASS[demand.type] ?? 'bg-gray-50 text-gray-600 border-gray-200'

  return (
    <div className="group flex flex-col rounded-xl border border-stone-100 bg-white shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide border flex-shrink-0 ${badgeClass}`}>
            {typeLabel}
          </span>
          {demand.province && (
            <span className="flex items-center gap-1 text-xs text-stone-400 truncate">
              <Icon icon={MapPin} size={12} />
              {demand.province}
            </span>
          )}
        </div>

        <Link
          to={`/supply/demands/${demand.id}`}
          className="text-sm font-semibold text-stone-900 line-clamp-2 group-hover:text-theme-accent transition-colors duration-200 mb-2"
        >
          <Highlight html={demand.highlightTitle} fallback={demand.title} />
        </Link>

        {(demand.highlightSummary || demand.summary) && (
          <p className="text-xs text-stone-500 line-clamp-2 mb-3 flex-1">
            <Highlight html={demand.highlightSummary} fallback={demand.summary ?? ''} />
          </p>
        )}

        {/* Budget */}
        <p className="flex items-center gap-1.5 text-xs text-stone-600 font-medium mb-2">
          <Icon icon={Banknote} size={13} className="text-stone-400 flex-shrink-0" />
          预算：{formatBudget(demand.budgetMin, demand.budgetMax)}
        </p>

        {demand.deadline && (
          <p className="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
            <Icon icon={Calendar} size={12} className="text-stone-400 flex-shrink-0" />
            截止：{formatDate(demand.deadline)}
          </p>
        )}

        {demand.tags && demand.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {demand.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded font-medium"
              >
                {tag.name}
              </span>
            ))}
            {demand.tags.length > 3 && (
              <span className="text-[10px] text-stone-400 px-1 py-0.5">+{demand.tags.length - 3}</span>
            )}
          </div>
        )}

        {demand.memberName && (
          <p className="flex items-center gap-1 text-xs text-stone-500 truncate">
            <Icon icon={Building2} size={12} className="flex-shrink-0 text-stone-400" />
            {demand.memberName}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3">
        <div className="flex items-center gap-3 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <Icon icon={Eye} size={12} />
            {demand.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <Icon icon={Calendar} size={12} />
            {formatDate(demand.createdAt)}
          </span>
        </div>
        <button
          type="button"
          aria-label={isFavorited ? '取消收藏' : '收藏'}
          onClick={() => onFavorite(demand.id, isFavorited)}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
            isFavorited
              ? 'text-rose-500 bg-rose-50 hover:bg-rose-100'
              : 'text-stone-400 hover:text-rose-400 hover:bg-rose-50'
          }`}
        >
          <Icon icon={Heart} size={16} className={isFavorited ? 'fill-rose-500' : ''} />
        </button>
      </div>
    </div>
  )
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

interface FilterState {
  type: string
  province: string
  tagId: number
}

interface FilterPanelProps {
  filters: FilterState
  tags: Tag[]
  tagsLoading: boolean
  onChange: (f: Partial<FilterState>) => void
  onReset: () => void
}

function FilterPanel({ filters, tags, tagsLoading, onChange, onReset }: FilterPanelProps) {
  const hasActive = !!(filters.type || filters.province || filters.tagId)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">需求类型</h3>
        <div className="space-y-2">
          {DEMAND_TYPES.map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-stone-50">
              <input
                type="checkbox"
                className="accent-theme-accent h-4 w-4 cursor-pointer rounded border-stone-300"
                checked={filters.type === t}
                onChange={() => onChange({ type: filters.type === t ? '' : t })}
              />
              <span className="text-sm text-stone-700">{DEMAND_TYPE_LABELS[t]}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">期望省份</h3>
        <select
          value={filters.province}
          onChange={(e) => onChange({ province: e.target.value })}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all duration-200"
        >
          <option value="">全部省份</option>
          {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">标签筛选</h3>
        {tagsLoading ? (
          <div className="flex justify-center py-4"><Spinner size="sm" className="text-stone-300" /></div>
        ) : tags.length === 0 ? (
          <p className="text-xs text-stone-400">暂无可用标签</p>
        ) : (
          <div className="space-y-1.5">
            {tags.map((tag) => (
              <label key={tag.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-stone-50">
                <input
                  type="checkbox"
                  className="accent-theme-accent h-4 w-4 cursor-pointer rounded border-stone-300"
                  checked={filters.tagId === tag.id}
                  onChange={() => onChange({ tagId: filters.tagId === tag.id ? 0 : tag.id })}
                />
                <span className="text-sm text-stone-700">{tag.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {hasActive && (
        <button
          type="button"
          onClick={onReset}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 py-2 text-sm text-stone-500 hover:bg-stone-50 hover:border-stone-300 transition-all duration-200"
        >
          <Icon icon={RefreshCw} size={14} />
          重置筛选
        </button>
      )}
    </div>
  )
}

// ─── Mobile Filter Drawer ─────────────────────────────────────────────────────

function FilterDrawer({ onClose, ...panelProps }: FilterPanelProps & { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="text-base font-semibold text-stone-900">筛选条件</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 transition-colors">
            <Icon icon={X} size={20} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          <FilterPanel {...panelProps} onReset={() => { panelProps.onReset(); onClose() }} />
        </div>
        <div className="border-t border-stone-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-theme-accent py-3 text-sm font-semibold text-white hover:bg-theme-accent-hover transition-all duration-200"
          >
            确认筛选
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Login prompt modal ───────────────────────────────────────────────────────

function LoginPromptModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-2xl bg-white p-8 shadow-xl max-w-sm w-full mx-4">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 transition-colors">
          <Icon icon={X} size={18} />
        </button>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-400 mx-auto">
          <Icon icon={Heart} size={22} />
        </div>
        <h3 className="text-center text-base font-semibold text-stone-900 mb-2">请先登录</h3>
        <p className="text-center text-sm text-stone-500 mb-6">登录后即可收藏感兴趣的需求</p>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-stone-200 py-2.5 text-sm text-stone-600 hover:bg-stone-50 transition-all duration-200">稍后再说</button>
          <button type="button" onClick={() => navigate('/login', { state: { from: location } })} className="flex-1 rounded-lg bg-theme-accent py-2.5 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200">去登录</button>
        </div>
      </div>
    </div>
  )
}

// ─── Active filter chips ──────────────────────────────────────────────────────

function ActiveFilters({
  type, province, tagId, tagName, keyword, onRemove,
}: {
  type: string; province: string; tagId: number; tagName: string; keyword: string
  onRemove: (key: 'type' | 'province' | 'tagId' | 'keyword') => void
}) {
  const chips: { key: 'type' | 'province' | 'tagId' | 'keyword'; label: string }[] = []
  if (keyword) chips.push({ key: 'keyword', label: `关键词: ${keyword}` })
  if (type) chips.push({ key: 'type', label: DEMAND_TYPE_LABELS[type] ?? type })
  if (province) chips.push({ key: 'province', label: province })
  if (tagId) chips.push({ key: 'tagId', label: tagName ? `#${tagName}` : '标签筛选' })
  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((chip) => (
        <span key={chip.key} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
          {chip.label}
          <button type="button" onClick={() => onRemove(chip.key)} className="rounded-full hover:text-blue-900 transition-colors">
            <Icon icon={X} size={12} />
          </button>
        </span>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupplyDemandListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const accountInfo = useAuthStore((s) => s.accountInfo)

  const keyword = searchParams.get('keyword') ?? ''
  const typeFilter = searchParams.get('type') ?? ''
  const province = searchParams.get('province') ?? ''
  const tagId = Number(searchParams.get('tagId')) || 0
  const page = Number(searchParams.get('page')) || 1

  const [inputValue, setInputValue] = useState(keyword)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loginPrompt, setLoginPrompt] = useState(false)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [favoriteError, setFavoriteError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setInputValue(keyword) }, [keyword])

  const setParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(updates).forEach(([k, v]) => {
            if (v === undefined || v === '') next.delete(k)
            else next.set(k, v)
          })
          return next
        },
        { replace: false },
      )
    },
    [setSearchParams],
  )

  function handleSearchInput(value: string) {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setParam({ keyword: value || undefined, page: undefined })
    }, 500)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setParam({ keyword: inputValue || undefined, page: undefined })
  }

  function handleFilterChange(f: Partial<FilterState>) {
    const updates: Record<string, string | undefined> = { page: undefined }
    if ('type' in f) updates.type = f.type || undefined
    if ('province' in f) updates.province = f.province || undefined
    if ('tagId' in f) updates.tagId = f.tagId ? String(f.tagId) : undefined
    setParam(updates)
  }

  function handleFilterReset() {
    setParam({ type: undefined, province: undefined, tagId: undefined, page: undefined })
  }

  function handleRemoveChip(key: 'type' | 'province' | 'tagId' | 'keyword') {
    if (key === 'keyword') { setInputValue(''); setParam({ keyword: undefined, page: undefined }) }
    else if (key === 'tagId') setParam({ tagId: undefined, page: undefined })
    else setParam({ [key]: undefined, page: undefined })
  }

  function handlePageChange(p: number) {
    setParam({ page: String(p) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const { data, isLoading, isFetching, isError } = useDemandList({
    page, size: PAGE_SIZE,
    keyword: keyword || undefined,
    type: typeFilter || undefined,
    province: province || undefined,
    tagId: tagId || undefined,
  })

  const { data: categories } = useQuery({
    queryKey: ['tag-categories'],
    queryFn: fetchTagCategories,
    staleTime: 1000 * 60 * 10,
  })

  const industryCategory = categories?.find((c) => c.code === 'INDUSTRY')

  const { data: tagPage, isLoading: tagsLoading } = useQuery({
    queryKey: ['tags', 'filter', industryCategory?.id],
    queryFn: () => fetchTags({ categoryId: industryCategory!.id, size: 30 }),
    enabled: !!industryCategory,
    staleTime: 1000 * 60 * 10,
  })

  const filterTags = tagPage?.records ?? []
  const activeTagName = filterTags.find((t) => t.id === tagId)?.name ?? ''

  const favoriteMutation = useFavoriteDemand()
  const unfavoriteMutation = useUnfavoriteDemand()

  function handleFavorite(id: number, isFavorited: boolean) {
    if (!accountInfo) { setLoginPrompt(true); return }
    const showError = () => {
      setFavoriteError('收藏操作失败，请稍后重试')
      setTimeout(() => setFavoriteError(null), 3000)
    }
    if (isFavorited) {
      unfavoriteMutation.mutate(id, {
        onSuccess: () => setFavorites((prev) => { const n = new Set(prev); n.delete(id); return n }),
        onError: showError,
      })
    } else {
      favoriteMutation.mutate(id, {
        onSuccess: () => setFavorites((prev) => { const n = new Set(prev); n.add(id); return n }),
        onError: showError,
      })
    }
  }

  const demands = data?.records ?? []
  const total = data?.total ?? 0
  const filterState: FilterState = { type: typeFilter, province, tagId }
  const filterPanelProps = { filters: filterState, tags: filterTags, tagsLoading, onChange: handleFilterChange, onReset: handleFilterReset }
  const activeFiltersCount = [typeFilter, province, tagId].filter(Boolean).length

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg">
      <PortalNav />

      <div className="bg-theme-surface border-b border-theme-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-theme-text-main">供需对接平台</h1>
          <p className="mt-1 text-sm text-theme-text-muted">绿色低碳供需资源汇聚 · 精准对接 · 共赢合作</p>

          {/* Resource / Demand tabs */}
          <div className="mt-4 flex gap-1 border-b border-stone-200">
            <Link
              to="/supply"
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300 -mb-px transition-colors"
            >
              资源列表
            </Link>
            <Link
              to="/supply/demands"
              className="px-4 py-2 text-sm font-medium border-b-2 border-theme-accent text-theme-accent -mb-px"
            >
              需求列表
            </Link>
            <Link
              to="/supply/demands/publish"
              className="ml-auto mb-1 inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200"
            >
              发布需求
            </Link>
          </div>

          <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                <Icon icon={Search} size={16} />
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="搜索需求名称、技术领域…"
                className="w-full rounded-lg border border-stone-200 bg-white pl-9 pr-4 py-2 text-sm outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all duration-200"
              />
            </div>
            <button type="submit" className="rounded-lg bg-theme-accent px-5 py-2 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200">搜索</button>
            {keyword && (
              <button
                type="button"
                onClick={() => { setInputValue(''); setParam({ keyword: undefined, page: undefined }) }}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-500 hover:bg-stone-50 hover:border-stone-300 transition-all duration-200"
              >
                清除
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-56 xl:w-64 flex-shrink-0">
            <div className="sticky top-20 rounded-xl border border-stone-100 bg-white p-5 shadow-card">
              <FilterPanel {...filterPanelProps} />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-all duration-200"
                >
                  <Icon icon={SlidersHorizontal} size={16} />
                  筛选
                  {activeFiltersCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-theme-accent text-[10px] font-bold text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                {!isLoading && (
                  <span className="text-sm text-stone-500">
                    共 <span className="font-semibold text-stone-800">{total}</span> 条需求
                  </span>
                )}
              </div>
              {isFetching && !isLoading && (
                <span className="flex items-center gap-1.5 text-xs text-stone-400">
                  <Spinner size="sm" className="text-stone-300" />
                  更新中
                </span>
              )}
            </div>

            {favoriteError && (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-red-50 border border-red-100 px-4 py-2 text-sm text-red-600">
                {favoriteError}
                <button type="button" onClick={() => setFavoriteError(null)} className="ml-4 text-red-400 hover:text-red-600">
                  <Icon icon={X} size={14} />
                </button>
              </div>
            )}

            <ActiveFilters
              type={typeFilter} province={province} tagId={tagId}
              tagName={activeTagName} keyword={keyword} onRemove={handleRemoveChip}
            />

            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => <DemandSkeletonCard key={i} />)
              ) : isError ? (
                <div className="col-span-full">
                  <ErrorState
                    title="加载失败"
                    description="需求列表加载异常，请检查网络或稍后重试"
                    action={
                      <button onClick={() => window.location.reload()} className="rounded-lg bg-theme-accent px-4 py-2 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200">
                        刷新页面
                      </button>
                    }
                  />
                </div>
              ) : demands.length > 0 ? (
                demands.map((d) => (
                  <DemandCard key={d.id} demand={d} isFavorited={favorites.has(d.id)} onFavorite={handleFavorite} />
                ))
              ) : (
                <div className="col-span-full">
                  <EmptyState
                    title={keyword || typeFilter || province || tagId ? '未找到相关需求' : '暂无需求'}
                    description={
                      keyword || typeFilter || province || tagId
                        ? '请尝试调整搜索条件或筛选项'
                        : '平台需求正在持续更新，欢迎发布您的合作需求'
                    }
                    action={
                      !keyword && !typeFilter && !province && !tagId ? (
                        <Link to="/supply/demands/publish" className="rounded-lg bg-theme-accent px-5 py-2 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200">
                          发布需求
                        </Link>
                      ) : undefined
                    }
                  />
                </div>
              )}
            </div>

            {total > PAGE_SIZE && (
              <div className="mt-8">
                <Pagination page={page} total={total} size={PAGE_SIZE} onChange={handlePageChange} />
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="bg-stone-900 text-stone-400 py-6 mt-auto">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs">
          © 2024 山东省绿色低碳产业协会 · 绿产智链平台
        </div>
      </footer>

      {drawerOpen && <FilterDrawer {...filterPanelProps} onClose={() => setDrawerOpen(false)} />}
      {loginPrompt && <LoginPromptModal onClose={() => setLoginPrompt(false)} />}
    </div>
  )
}
