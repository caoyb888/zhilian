import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { clsx } from 'clsx'
import { Boxes, ClipboardList, ExternalLink, Heart } from 'lucide-react'
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
}

const TABS: TabDef[] = [
  { key: 'RESOURCE', label: '资源收藏', icon: Boxes },
  { key: 'DEMAND',   label: '需求收藏', icon: ClipboardList },
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
  const typeLabel = getTypeLabel(item.bizType, item.type)

  return (
    <div className="flex gap-4 rounded-xl border border-stone-100 bg-white p-4 shadow-card transition-all duration-150 hover:border-stone-200 hover:shadow-md">
      {/* Type badge + content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              {typeLabel}
            </span>
            <Link
              to={detailPath}
              className="text-sm font-semibold text-stone-900 truncate hover:text-emerald-700 transition-colors flex items-center gap-1 group"
            >
              <span className="truncate">{item.title}</span>
              <Icon
                icon={ExternalLink}
                size={11}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </Link>
          </div>
          <span className="shrink-0 text-xs text-stone-400">{formatTime(item.createdAt)}</span>
        </div>

        {item.summary && (
          <p className="mt-1.5 text-xs text-stone-500 leading-relaxed line-clamp-2">
            {item.summary}
          </p>
        )}
      </div>

      {/* Unfavorite button */}
      <div className="shrink-0 flex items-start pt-0.5">
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

  const tab = (searchParams.get('tab') ?? 'RESOURCE') as TabKey
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const { data, isLoading } = useFavoriteList(tab, page, PAGE_SIZE)

  const unfavoriteResource = useUnfavoriteResource()
  const unfavoriteDemand   = useUnfavoriteDemand()

  const isPending = unfavoriteResource.isPending || unfavoriteDemand.isPending

  const handleUnfavorite = useCallback(
    (item: FavoriteItem) => {
      if (item.bizType === 'RESOURCE') {
        unfavoriteResource.mutate(item.bizId)
      } else {
        unfavoriteDemand.mutate(item.bizId)
      }
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

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-theme-text-main flex items-center gap-2">
          <Icon icon={Heart} size={20} className="text-rose-500" />
          我的收藏
        </h1>
        {data && data.total > 0 && (
          <p className="mt-0.5 text-xs text-stone-400">共 {data.total} 条收藏</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-stone-100 bg-white p-1 shadow-card">
        {TABS.map((t) => {
          const isActive = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTabChange(t.key)}
              className={clsx(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800',
              )}
            >
              <Icon icon={t.icon} size={14} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <SkeletonList count={5} />
      ) : !data?.records.length ? (
        <EmptyState
          icon={Heart}
          title="暂无收藏"
          description={tab === 'RESOURCE' ? '您还没有收藏任何资源，前往资源列表浏览' : '您还没有收藏任何需求，前往需求列表浏览'}
          action={
            <Link
              to={tab === 'RESOURCE' ? '/supply' : '/supply/demands'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
            >
              <Icon icon={tab === 'RESOURCE' ? Boxes : ClipboardList} size={14} />
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

      {/* Pagination */}
      {data && data.total > PAGE_SIZE && (
        <Pagination
          page={page}
          total={data.total}
          size={PAGE_SIZE}
          onChange={handlePageChange}
        />
      )}
    </div>
  )
}
