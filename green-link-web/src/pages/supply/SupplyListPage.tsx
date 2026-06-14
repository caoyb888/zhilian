import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import {
  Building2, Search, SlidersHorizontal, X, Heart, Eye, MapPin, Calendar, RefreshCw, Handshake, ChevronRight,
  Layers, Tag as TagIcon, type LucideIcon,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Pagination } from '@/components/Pagination'
import { Spinner } from '@/components/Spinner'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { PortalNav } from '@/business/PortalNav'
import { useAuthStore } from '@/stores/authStore'
import {
  useResourceList,
  useFavoriteResource,
  useUnfavoriteResource,
  useFavoriteIds,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPES,
  PROVINCES,
  type ResourceItem,
} from '@/services/supplyService'
import { fetchTagCategories, fetchTags, type Tag } from '@/services/tagService'
import { useQuery } from '@tanstack/react-query'

const PAGE_SIZE = 12

// ─── Highlight-aware text render ──────────────────────────────────────────────

function Highlight({ html, fallback }: { html: string | null; fallback: string }) {
  if (!html) return <>{fallback}</>
  return (
    <span
      className="highlight"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, { ALLOWED_TAGS: ['em'] }) }}
    />
  )
}

// ─── Resource type badge color ─────────────────────────────────────────────────

const TYPE_BADGE_CLASS: Record<string, string> = {
  PRODUCT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TECHNOLOGY: 'bg-blue-50 text-blue-700 border-blue-200',
  TALENT: 'bg-purple-50 text-purple-700 border-purple-200',
}

const TYPE_ACCENT_BAR: Record<string, string> = {
  PRODUCT: 'bg-emerald-500',
  TECHNOLOGY: 'bg-blue-500',
  TALENT: 'bg-purple-500',
}

const AUDIT_STATUS_MAP: Record<number, { label: string; className: string }> = {
  0: { label: '待审核', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  1: { label: '可对接', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  2: { label: '已拒绝', className: 'bg-red-50 text-red-700 border-red-200' },
  3: { label: '已下架', className: 'bg-stone-100 text-stone-600 border-stone-200' },
}

function formatDate(s: string) {
  return s ? s.slice(0, 10) : ''
}

// ─── Skeleton loading ─────────────────────────────────────────────────────────

function ResourceSkeletonCard() {
  return (
    <div className="relative rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm animate-pulse overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-stone-100" />
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-16 rounded-full bg-stone-100" />
        <div className="h-4 w-20 rounded-full bg-stone-100" />
      </div>
      <div className="h-4 w-full rounded bg-stone-100 mb-2" />
      <div className="h-4 w-4/5 rounded bg-stone-100 mb-3" />
      <div className="h-3 w-3/5 rounded bg-stone-100 mb-4" />
      <div className="flex gap-1 mb-4">
        <div className="h-5 w-12 rounded-full bg-stone-100" />
        <div className="h-5 w-14 rounded-full bg-stone-100" />
      </div>
      <div className="flex items-center justify-between border-t border-stone-100 pt-3">
        <div className="h-3 w-24 rounded bg-stone-100" />
        <div className="h-8 w-8 rounded-full bg-stone-100" />
      </div>
    </div>
  )
}

// ─── Resource Card ─────────────────────────────────────────────────────────────

interface ResourceCardProps {
  resource: ResourceItem
  isFavorited: boolean
  onFavorite: (id: number, favorited: boolean) => void
}

function ResourceCard({ resource, isFavorited, onFavorite }: ResourceCardProps) {
  const typeLabel = RESOURCE_TYPE_LABELS[resource.type] ?? resource.type
  const badgeClass = TYPE_BADGE_CLASS[resource.type] ?? 'bg-gray-50 text-gray-600 border-gray-200'

  const cooperationChips = resource.cooperationMode
    ? resource.cooperationMode.split(/[,，、/]/).map((s) => s.trim()).filter(Boolean).slice(0, 3)
    : []

  return (
    <div className="group relative flex flex-col rounded-2xl border border-stone-200/80 bg-white shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
      {/* Left accent bar — color matches resource type */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${TYPE_ACCENT_BAR[resource.type] ?? 'bg-stone-400'}`} />

      <div className="flex flex-1 flex-col p-5">
        {/* Type badge + status + location */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide border flex-shrink-0 ${badgeClass}`}>
              {typeLabel}
            </span>
            {(() => {
              const status = AUDIT_STATUS_MAP[resource.auditStatus]
              if (!status) return null
              return (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border flex-shrink-0 ${status.className}`}>
                  {status.label}
                </span>
              )
            })()}
          </div>
          {(resource.province || resource.city) && (
            <span className="flex items-center gap-1 text-xs text-stone-400 truncate flex-shrink-0">
              <Icon icon={MapPin} size={12} />
              {resource.province}{resource.city ? `·${resource.city}` : ''}
            </span>
          )}
        </div>

        {/* Title */}
        <Link
          to={`/supply/resources/${resource.id}`}
          className="text-sm font-semibold text-stone-900 line-clamp-2 group-hover:text-emerald-600 transition-colors duration-200 mb-2"
        >
          <Highlight html={resource.highlightTitle} fallback={resource.title} />
        </Link>

        {/* Summary */}
        {(resource.highlightSummary || resource.summary) && (
          <p className="text-xs text-stone-500 line-clamp-2 mb-3 flex-1">
            <Highlight html={resource.highlightSummary} fallback={resource.summary ?? ''} />
          </p>
        )}

        {/* Cooperation mode chips */}
        {cooperationChips.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {cooperationChips.map((mode, i) => (
              <span key={i} className="text-[10px] bg-stone-50 text-stone-500 border border-stone-200 px-2 py-0.5 rounded-full">
                {mode}
              </span>
            ))}
          </div>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-medium">
                {tag.name}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="text-[10px] text-stone-400 px-1 py-0.5">+{resource.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Company */}
        {resource.memberName && (
          <p className="flex items-center gap-1 text-xs text-stone-500 truncate">
            <Icon icon={Building2} size={12} className="flex-shrink-0 text-stone-400" />
            {resource.memberName}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3">
        <div className="flex items-center gap-3 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <Icon icon={Eye} size={12} />
            {resource.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <Icon icon={Calendar} size={12} />
            {formatDate(resource.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/supply/resources/${resource.id}`}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-all duration-200"
          >
            申请对接
            <Icon icon={ChevronRight} size={11} />
          </Link>
          <button
            type="button"
            aria-label={isFavorited ? '取消收藏' : '收藏'}
            onClick={() => onFavorite(resource.id, isFavorited)}
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

const RESOURCE_TYPE_PILL: Record<string, { active: string; dot: string }> = {
  PRODUCT:    { active: 'bg-emerald-50 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' },
  TECHNOLOGY: { active: 'bg-blue-50 text-blue-700 border-blue-300',         dot: 'bg-blue-500' },
  TALENT:     { active: 'bg-purple-50 text-purple-700 border-purple-300',    dot: 'bg-purple-500' },
}

function FilterSection({
  icon, iconClass, label, children,
}: {
  icon: LucideIcon
  iconClass: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`flex h-6 w-6 items-center justify-center rounded-md flex-shrink-0 ${iconClass}`}>
          <Icon icon={icon} size={13} />
        </span>
        <p className="text-xs font-semibold text-stone-700">{label}</p>
      </div>
      {children}
    </div>
  )
}

function FilterPanel({ filters, tags, tagsLoading, onChange, onReset }: FilterPanelProps) {
  const hasActive = !!(filters.type || filters.province || filters.tagId)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <span className="text-xs font-bold text-stone-600 tracking-wide">筛选器</span>
        {hasActive && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors flex items-center gap-1"
          >
            <Icon icon={RefreshCw} size={12} />
            重置
          </button>
        )}
      </div>

      {/* 资源类型 — 翡翠绿 */}
      <FilterSection icon={Layers} iconClass="bg-emerald-100 text-emerald-600" label="资源类型">
        <div className="flex flex-wrap gap-2">
          {RESOURCE_TYPES.map((t) => {
            const isActive = filters.type === t
            const style = RESOURCE_TYPE_PILL[t]
            return (
              <button
                key={t}
                type="button"
                onClick={() => onChange({ type: isActive ? '' : t })}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-200 ${
                  isActive
                    ? (style?.active ?? 'bg-emerald-50 text-emerald-700 border-emerald-400')
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${isActive ? (style?.dot ?? 'bg-emerald-500') : 'bg-stone-300'}`} />
                {RESOURCE_TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>
      </FilterSection>

      {/* 所在省份 — 蓝色 */}
      <FilterSection icon={MapPin} iconClass="bg-blue-100 text-blue-600" label="所在省份">
        <select
          value={filters.province}
          onChange={(e) => onChange({ province: e.target.value })}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 transition-all duration-200"
        >
          <option value="">全部省份</option>
          {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </FilterSection>

      {/* 行业标签 — 紫色 */}
      <FilterSection icon={TagIcon} iconClass="bg-violet-100 text-violet-600" label="行业标签">
        {tagsLoading ? (
          <div className="flex justify-center py-4">
            <Spinner size="sm" className="text-stone-300" />
          </div>
        ) : tags.length === 0 ? (
          <p className="text-xs text-stone-400">暂无可用标签</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const isActive = filters.tagId === tag.id
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => onChange({ tagId: isActive ? 0 : tag.id })}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-all duration-200 ${
                    isActive
                      ? 'bg-violet-500 text-white border-violet-500'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50'
                  }`}
                >
                  #{tag.name}
                </button>
              )
            })}
          </div>
        )}
      </FilterSection>
    </div>
  )
}

// ─── Mobile Filter Drawer ─────────────────────────────────────────────────────

interface FilterDrawerProps extends FilterPanelProps {
  onClose: () => void
}

function FilterDrawer({ onClose, ...panelProps }: FilterDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="text-base font-semibold text-stone-900">筛选条件</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 transition-colors"
            aria-label="关闭"
          >
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
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 transition-colors"
        >
          <Icon icon={X} size={18} />
        </button>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-400 mx-auto">
          <Icon icon={Heart} size={22} />
        </div>
        <h3 className="text-center text-base font-semibold text-stone-900 mb-2">请先登录</h3>
        <p className="text-center text-sm text-stone-500 mb-6">登录后即可收藏感兴趣的资源</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-stone-200 py-2.5 text-sm text-stone-600 hover:bg-stone-50 transition-all duration-200"
          >
            稍后再说
          </button>
          <button
            type="button"
            onClick={() => navigate('/login', { state: { from: location } })}
            className="flex-1 rounded-lg bg-theme-accent py-2.5 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200"
          >
            去登录
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Active filter chips ──────────────────────────────────────────────────────

interface ActiveFiltersProps {
  type: string
  province: string
  tagId: number
  tagName: string
  keyword: string
  onRemove: (key: 'type' | 'province' | 'tagId' | 'keyword') => void
}

function ActiveFilters({ type, province, tagId, tagName, keyword, onRemove }: ActiveFiltersProps) {
  const chips: { key: 'type' | 'province' | 'tagId' | 'keyword'; label: string }[] = []
  if (keyword) chips.push({ key: 'keyword', label: `关键词: ${keyword}` })
  if (type) chips.push({ key: 'type', label: RESOURCE_TYPE_LABELS[type] ?? type })
  if (province) chips.push({ key: 'province', label: province })
  if (tagId) chips.push({ key: 'tagId', label: tagName ? `#${tagName}` : '标签筛选' })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            className="rounded-full hover:text-emerald-900 transition-colors"
            aria-label={`移除 ${chip.label}`}
          >
            <Icon icon={X} size={12} />
          </button>
        </span>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupplyListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const accountInfo = useAuthStore((s) => s.accountInfo)

  // URL-synced state
  const keyword = searchParams.get('keyword') ?? ''
  const typeFilter = searchParams.get('type') ?? ''
  const province = searchParams.get('province') ?? ''
  const tagId = Number(searchParams.get('tagId')) || 0
  const page = Number(searchParams.get('page')) || 1

  // Local UI state
  const [inputValue, setInputValue] = useState(keyword)
  const [prevKeyword, setPrevKeyword] = useState(keyword)
  if (prevKeyword !== keyword) {
    setPrevKeyword(keyword)
    setInputValue(keyword)
  }
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loginPrompt, setLoginPrompt] = useState(false)
  const [favoriteError, setFavoriteError] = useState<string | null>(null)

  const { data: favoriteIds } = useFavoriteIds('RESOURCE', !!accountInfo)
  const favorites = useMemo(() => new Set(favoriteIds ?? []), [favoriteIds])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Debounced search
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

  function handleFilterChange(f: Partial<{ type: string; province: string; tagId: number }>) {
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
    if (key === 'keyword') {
      setInputValue('')
      setParam({ keyword: undefined, page: undefined })
    } else if (key === 'tagId') {
      setParam({ tagId: undefined, page: undefined })
    } else {
      setParam({ [key]: undefined, page: undefined })
    }
  }

  function handlePageChange(p: number) {
    setParam({ page: String(p) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Fetch resources
  const { data, isLoading, isFetching, isError } = useResourceList({
    page,
    size: PAGE_SIZE,
    keyword: keyword || undefined,
    type: typeFilter || undefined,
    province: province || undefined,
    tagId: tagId || undefined,
  })

  // Fetch tags for filter (INDUSTRY category)
  const { data: categories } = useQuery({
    queryKey: ['tag-categories'],
    queryFn: fetchTagCategories,
    staleTime: 1000 * 60 * 10,
  })

  const industryCategory = useMemo(
    () => categories?.find((c) => c.code === 'INDUSTRY'),
    [categories],
  )

  const { data: tagPage, isLoading: tagsLoading } = useQuery({
    queryKey: ['tags', 'filter', industryCategory?.id],
    queryFn: () => fetchTags({ categoryId: industryCategory!.id, size: 30 }),
    enabled: !!industryCategory,
    staleTime: 1000 * 60 * 10,
  })

  const filterTags = tagPage?.records ?? []

  // Find tag name for active chip
  const activeTagName = filterTags.find((t) => t.id === tagId)?.name ?? ''

  // Favorites
  const favoriteMutation = useFavoriteResource()
  const unfavoriteMutation = useUnfavoriteResource()

  function handleFavorite(id: number, isFavorited: boolean) {
    if (!accountInfo) {
      setLoginPrompt(true)
      return
    }
    const showError = () => {
      setFavoriteError('收藏操作失败，请稍后重试')
      setTimeout(() => setFavoriteError(null), 3000)
    }
    if (isFavorited) {
      unfavoriteMutation.mutate(id, { onError: showError })
    } else {
      favoriteMutation.mutate(id, { onError: showError })
    }
  }

  const resources = data?.records ?? []
  const total = data?.total ?? 0

  const filterState = { type: typeFilter, province, tagId }
  const filterPanelProps = {
    filters: filterState,
    tags: filterTags,
    tagsLoading,
    onChange: handleFilterChange,
    onReset: handleFilterReset,
  }

  const activeFiltersCount = [typeFilter, province, tagId].filter(Boolean).length

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg">
      <PortalNav />

      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* 品牌色渐变背景 */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(0,102,79,0.9) 0%, rgba(76,175,80,0.9) 100%)',
          }}
        />
        {/* 科技感方格纹路 */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* 左侧：标题 + 副标题 */}
            <div>
              <div className="flex items-center gap-2">
                <Icon icon={Handshake} size={24} className="text-white/70" />
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">供需对接平台</h1>
              </div>
              <p className="mt-1 text-sm text-white/70">绿色低碳供需资源汇聚 · 精准对接 · 共赢合作</p>
            </div>

            {/* 右侧：搜索组件（玻璃拟态） */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex gap-2 w-full max-w-sm"
            >
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
                  <Icon icon={Search} size={16} />
                </div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder="搜索资源名称、技术领域…"
                  className="w-full rounded-[30px] bg-white/20 backdrop-blur-md border border-white/30 pl-10 pr-4 py-2 text-sm text-white placeholder-white/60 outline-none focus:bg-white/30 focus:border-white/50 shadow-md shadow-black/10 transition-all duration-200"
                />
              </div>
              <button
                type="submit"
                className="flex-shrink-0 rounded-[30px] bg-stone-800 px-5 py-2 text-sm font-medium text-white hover:bg-stone-700 transition-all duration-200"
              >
                搜索
              </button>
              {keyword && (
                <button
                  type="button"
                  onClick={() => { setInputValue(''); setParam({ keyword: undefined, page: undefined }) }}
                  className="flex-shrink-0 rounded-[30px] border border-white/30 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-all duration-200"
                >
                  清除
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Ticker bar */}
      <div className="relative overflow-hidden" style={{ background: 'rgba(0, 60, 45, 0.85)' }}>
        <style>{`
          @keyframes ticker-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .ticker-animate {
            animation: ticker-scroll 20s linear infinite;
          }
        `}</style>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center gap-3">
            <span className="flex-shrink-0 text-[10px] font-bold text-emerald-200 uppercase tracking-wider bg-emerald-500/20 rounded px-1.5 py-0.5">
              最新供需
            </span>
            <div className="flex-1 overflow-hidden relative">
              <div className="ticker-animate flex gap-8 whitespace-nowrap w-max">
                {[
                  { type: '需求', text: '某企业求购光伏组件供应商' },
                  { type: '资源', text: '新能源储能技术专利寻求合作' },
                  { type: '对接', text: '碳中和服务商招募合作伙伴' },
                  { type: '需求', text: '绿色建筑节能改造方案征集' },
                ].map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-2 text-sm text-white/90">
                    <span className="bg-emerald-500/25 rounded px-1.5 py-0.5 text-[10px] font-bold text-emerald-200">{item.type}</span>
                    {item.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + 发布按钮 */}
      <div className="bg-white border-b border-theme-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center flex-wrap gap-2">
              <Link
                to="/supply"
                className="rounded-full px-4 py-1.5 text-sm font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 transition-all duration-200"
              >
                资源列表
              </Link>
              <Link
                to="/supply/demands"
                className="rounded-full px-4 py-1.5 text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-all duration-200"
              >
                需求列表
              </Link>
              {!isLoading && (
                <span className="hidden sm:inline text-sm text-stone-400 ml-2">
                  共 <span className="font-semibold text-stone-600">{total}</span> 条资源
                </span>
              )}
            </div>
            <Link
              to="/supply/resources/publish"
              className="inline-flex items-center gap-1.5 rounded-full bg-theme-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200"
            >
              发布资源
            </Link>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-6">
          {/* Desktop filter sidebar */}
          <aside className="hidden lg:block w-56 xl:w-64 flex-shrink-0 self-start">
            <div className="sticky top-[4.5rem] rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm">
              <FilterPanel {...filterPanelProps} />
            </div>
          </aside>

          {/* Right content */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter + result count row */}
            <div className="flex items-center justify-between mb-4 gap-3 lg:hidden">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-600 hover:bg-stone-50 transition-all duration-200 min-h-[44px]"
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
                  <span className="text-sm text-stone-500 lg:hidden">
                    共 <span className="font-semibold text-stone-800">{total}</span> 条资源
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

            {/* Favorite error banner */}
            {favoriteError && (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-red-50 border border-red-100 px-4 py-2 text-sm text-red-600">
                {favoriteError}
                <button type="button" onClick={() => setFavoriteError(null)} className="ml-4 text-red-400 hover:text-red-600">
                  <Icon icon={X} size={14} />
                </button>
              </div>
            )}

            {/* Active filter chips */}
            <ActiveFilters
              type={typeFilter}
              province={province}
              tagId={tagId}
              tagName={activeTagName}
              keyword={keyword}
              onRemove={handleRemoveChip}
            />

            {/* Resource grid */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 transition-opacity duration-200 ${
                isFetching && !isLoading ? 'opacity-60' : ''
              }`}
            >
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <ResourceSkeletonCard key={i} />
                ))
              ) : isError ? (
                <div className="col-span-full">
                  <ErrorState
                    title="加载失败"
                    description="资源列表加载异常，请检查网络或稍后重试"
                    action={
                      <button
                        onClick={() => window.location.reload()}
                        className="rounded-lg bg-theme-accent px-4 py-2 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200"
                      >
                        刷新页面
                      </button>
                    }
                  />
                </div>
              ) : resources.length > 0 ? (
                resources.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    isFavorited={favorites.has(r.id)}
                    onFavorite={handleFavorite}
                  />
                ))
              ) : (
                <div className="col-span-full">
                  <EmptyState
                    title={keyword || typeFilter || province || tagId ? '未找到相关资源' : '暂无资源'}
                    description={
                      keyword || typeFilter || province || tagId
                        ? '请尝试调整搜索条件或筛选项'
                        : '平台资源正在持续更新，欢迎发布您的供需资源'
                    }
                    action={
                      !keyword && !typeFilter && !province && !tagId ? (
                        <Link
                          to="/supply/resources/publish"
                          className="rounded-lg bg-theme-accent px-5 py-2 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200"
                        >
                          发布资源
                        </Link>
                      ) : undefined
                    }
                  />
                </div>
              )}
            </div>

            {/* Pagination */}
            {total > PAGE_SIZE && (
              <div className="mt-8">
                <Pagination
                  page={page}
                  total={total}
                  size={PAGE_SIZE}
                  onChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-6 mt-auto">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs">
          © 2024 山东省绿色低碳产业协会 · 绿产智链平台
        </div>
      </footer>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <FilterDrawer {...filterPanelProps} onClose={() => setDrawerOpen(false)} />
      )}

      {/* Login prompt */}
      {loginPrompt && <LoginPromptModal onClose={() => setLoginPrompt(false)} />}
    </div>
  )
}
