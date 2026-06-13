import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { clsx } from 'clsx'
import { Boxes, ClipboardList, ExternalLink, Heart, Star } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/Button'
import { Pagination } from '@/components/Pagination'
import { EmptyState } from '@/components/states/EmptyState'
import { SkeletonList } from '@/components/states/SkeletonList'
import {
  useFavoriteList,
  useUnfavoriteResource,
  useUnfavoriteDemand,
  RESOURCE_TYPE_LABELS,
  DEMAND_TYPE_LABELS,
  type FavoriteItem,
} from '@/services/supplyService'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15

type TabKey = 'RESOURCE' | 'DEMAND'

interface TabDef {
  key: TabKey
  label: string
  icon: typeof Boxes
  color: string
}

const TABS: TabDef[] = [
  { key: 'RESOURCE', label: '资源收藏', icon: Boxes,         color: 'text-emerald-600' },
  { key: 'DEMAND',   label: '需求收藏', icon: ClipboardList, color: 'text-blue-600' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} 小时前`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD} 天前`
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' })
}

function getTypeLabel(bizType: TabKey, type: string): string {
  if (bizType === 'RESOURCE') return RESOURCE_TYPE_LABELS[type] ?? type
  return DEMAND_TYPE_LABELS[type] ?? type
}

function getDetailPath(item: FavoriteItem): string {
  return item.bizType === 'RESOURCE'
    ? `/supply/resources/${item.bizId}`
    : `/supply/demands/${item.bizId}`
}

// ─── Favorite Card ────────────────────────────────────────────────────────────

function FavoriteCard({
  item,
  onUnfavorite,
  isPending,
}: {
  item: FavoriteItem
  onUnfavorite: (item: FavoriteItem) => void
  isPending: boolean
}) {
  const detailPath = getDetailPath(item)
  const typeLabel  = getTypeLabel(item.bizType, item.type)
  const isResource = item.bizType === 'RESOURCE'

  return (
    <div
      className={clsx(
        'group relative flex gap-4 rounded-xl border bg-white shadow-card',
        'transition-all duration-200 hover:shadow-card-hover',
        'pl-4 border-l-[3px] pr-4 py-4',
        isResource
          ? 'border-stone-100 border-l-emerald-500 hover:border-emerald-200/60'
          : 'border-stone-100 border-l-blue-500 hover:border-blue-200/60',
      )}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span
              className={clsx(
                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                isResource
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200',
              )}
            >
              {typeLabel}
            </span>
            <Link
              to={detailPath}
              className="text-sm font-semibold text-stone-900 truncate hover:text-emerald-700 transition-colors flex items-center gap-1 group/link"
            >
              <span className="truncate">{item.title}</span>
              <Icon
                icon={ExternalLink}
                size={11}
                className="shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity"
              />
            </Link>
          </div>
          <span className="shrink-0 text-[11px] text-stone-400 tabular-nums">
            {formatTime(item.createdAt)}
          </span>
        </div>

        {item.summary && (
          <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">{item.summary}</p>
        )}
      </div>

      {/* Unfavorite */}
      <div className="shrink-0 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          loading={isPending}
          onClick={() => onUnfavorite(item)}
          className="text-rose-400 hover:text-rose-600 hover:bg-rose-50"
          title="取消收藏"
        >
          <Icon icon={Heart} size={15} className="fill-rose-400" />
        </Button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FavoritesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const tab  = (searchParams.get('tab') ?? 'RESOURCE') as TabKey
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const { data, isLoading } = useFavoriteList(tab, page, PAGE_SIZE)

  const unfavoriteResource = useUnfavoriteResource()
  const unfavoriteDemand   = useUnfavoriteDemand()
  const isPending = unfavoriteResource.isPending || unfavoriteDemand.isPending

  const handleUnfavorite = useCallback(
    (item: FavoriteItem) => {
      if (item.bizType === 'RESOURCE') unfavoriteResource.mutate(item.bizId)
      else unfavoriteDemand.mutate(item.bizId)
    },
    [unfavoriteResource, unfavoriteDemand],
  )

  function handleTabChange(key: TabKey) {
    setSearchParams({ tab: key, page: '1' })
  }

  function handlePageChange(p: number) {
    setSearchParams({ tab, page: String(p) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0]

  return (
    <div className="flex flex-col gap-4">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        {/* Gradient base */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #065f46 0%, #0d9488 100%)',
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Radial highlight */}
        <div
          className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #34d399, transparent)' }}
        />

        <div className="relative flex items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            {/* Icon badge */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <Icon icon={Heart} size={22} className="fill-white text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">我的收藏</h1>
              <p className="mt-0.5 text-sm text-emerald-100/75">收藏的资源与需求，随时回顾</p>
            </div>
          </div>

          {/* Count badge */}
          {data && data.total > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/20 backdrop-blur-sm">
              <Icon icon={Star} size={14} className="text-yellow-300" />
              <div className="text-right">
                <p className="text-xl font-bold leading-none text-white">{data.total}</p>
                <p className="mt-0.5 text-[10px] text-emerald-100/70">条收藏</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="rounded-xl border border-stone-100 bg-white shadow-card overflow-hidden">
        <div className="flex border-b border-stone-100 px-2">
          {TABS.map((t) => {
            const isActive = tab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleTabChange(t.key)}
                className={clsx(
                  'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-150',
                  isActive ? t.color : 'text-stone-500 hover:text-stone-700',
                )}
              >
                <Icon icon={t.icon} size={14} />
                <span>{t.label}</span>
                {isActive && (
                  <span
                    className={clsx(
                      'absolute bottom-0 left-0 right-0 h-[2px] rounded-t',
                      t.key === 'RESOURCE' ? 'bg-emerald-500' : 'bg-blue-500',
                    )}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* ── List ── */}
        <div className="p-4">
          {isLoading ? (
            <SkeletonList count={5} />
          ) : !data?.records.length ? (
            <EmptyState
              icon={Heart}
              title="暂无收藏"
              description={
                tab === 'RESOURCE'
                  ? '您还没有收藏任何资源，前往资源列表浏览'
                  : '您还没有收藏任何需求，前往需求列表浏览'
              }
              action={
                <Link
                  to={tab === 'RESOURCE' ? '/supply' : '/supply/demands'}
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
                    activeTab.key === 'RESOURCE'
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-blue-500 hover:bg-blue-600',
                  )}
                >
                  <Icon icon={activeTab.icon} size={14} />
                  {tab === 'RESOURCE' ? '浏览资源' : '浏览需求'}
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {data.records.map((item) => (
                <FavoriteCard
                  key={item.favoriteId}
                  item={item}
                  onUnfavorite={handleUnfavorite}
                  isPending={isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Pagination ── */}
      {data && data.total > PAGE_SIZE && (
        <Pagination page={page} total={data.total} size={PAGE_SIZE} onChange={handlePageChange} />
      )}
    </div>
  )
}
