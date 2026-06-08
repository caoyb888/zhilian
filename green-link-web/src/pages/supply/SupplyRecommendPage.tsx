import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Sparkles, Building2, MapPin, ChevronRight, CheckCircle2, Zap,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Pagination } from '@/components/Pagination'
import { Spinner } from '@/components/Spinner'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { PortalNav } from '@/business/PortalNav'
import { ApplyMatchDialog, type ApplyTarget } from '@/business/ApplyMatchDialog'
import { useAuthStore } from '@/stores/authStore'
import { useMyResources, useMyDemands, RESOURCE_TYPE_LABELS, DEMAND_TYPE_LABELS, type ResourceItem, type DemandItem } from '@/services/supplyService'
import { useRecommendations, type RecommendItem } from '@/services/matchService'

const PAGE_SIZE = 10

// ─── Member level labels ──────────────────────────────────────────────────────

const MEMBER_LEVEL_LABELS: Record<number, string> = { 1: '普通', 2: 'VIP', 3: '理事' }
const MEMBER_LEVEL_CLASS: Record<number, string> = {
  1: 'bg-stone-50 text-stone-500 border-stone-200',
  2: 'bg-amber-50 text-amber-700 border-amber-200',
  3: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

// ─── Match score ring ─────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 22
  const circumference = 2 * Math.PI * r
  const filled = (Math.min(score, 100) / 100) * circumference
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#94a3b8'

  return (
    <svg width="60" height="60" viewBox="0 0 60 60" aria-label={`匹配度 ${Math.round(score)} 分`}>
      <circle cx="30" cy="30" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
      <circle
        cx="30" cy="30" r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 30 30)"
      />
      <text x="30" y="34" textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
        {Math.round(score)}
      </text>
    </svg>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function RecommendSkeletonCard() {
  return (
    <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-[60px] w-[60px] rounded-full bg-stone-100 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-3/4 rounded bg-stone-100 mb-2" />
          <div className="h-3 w-1/2 rounded bg-stone-100 mb-3" />
          <div className="flex gap-1.5 mb-3">
            <div className="h-5 w-20 rounded bg-stone-100" />
            <div className="h-5 w-16 rounded bg-stone-100" />
            <div className="h-5 w-24 rounded bg-stone-100" />
          </div>
          <div className="h-3 w-1/3 rounded bg-stone-100" />
        </div>
      </div>
      <div className="mt-4 border-t border-stone-100 pt-4 flex justify-end">
        <div className="h-8 w-24 rounded-lg bg-stone-100" />
      </div>
    </div>
  )
}

// ─── Recommend card ───────────────────────────────────────────────────────────

interface RecommendCardProps {
  item: RecommendItem
  onApply: (item: RecommendItem) => void
}

function RecommendCard({ item, onApply }: RecommendCardProps) {
  const detailPath = item.targetType === 'RESOURCE'
    ? `/supply/resources/${item.targetId}`
    : `/supply/demands/${item.targetId}`

  const levelClass = MEMBER_LEVEL_CLASS[item.targetMember?.memberLevel ?? 1]
    ?? MEMBER_LEVEL_CLASS[1]
  const levelLabel = MEMBER_LEVEL_LABELS[item.targetMember?.memberLevel ?? 1] ?? '普通'

  return (
    <div className="group flex flex-col rounded-xl border border-stone-100 bg-white shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start gap-4 p-5">
        {/* Score ring */}
        <div className="flex flex-col items-center flex-shrink-0">
          <ScoreRing score={item.matchScore} />
          <span className="mt-1 text-[10px] text-stone-400">匹配度</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <Link
            to={detailPath}
            className="block text-sm font-semibold text-stone-900 line-clamp-2 group-hover:text-theme-accent transition-colors duration-200 mb-1.5"
          >
            {item.targetTitle || '（标题加载中）'}
          </Link>

          {/* Company + province */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2.5">
            {item.targetMember?.name && (
              <span className="flex items-center gap-1 text-xs text-stone-500 truncate">
                <Icon icon={Building2} size={11} className="text-stone-400 flex-shrink-0" />
                {item.targetMember.name}
              </span>
            )}
            {item.targetMember?.province && (
              <span className="flex items-center gap-1 text-xs text-stone-400">
                <Icon icon={MapPin} size={11} className="flex-shrink-0" />
                {item.targetMember.province}
              </span>
            )}
            {item.targetMember?.memberLevel && (
              <span
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide border ${levelClass}`}
              >
                {levelLabel}会员
              </span>
            )}
          </div>

          {/* Match reasons */}
          {item.matchReasons && item.matchReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.matchReasons.map((reason, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700 font-medium"
                >
                  <Icon icon={Zap} size={10} />
                  {reason}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end border-t border-stone-100 px-5 py-3">
        {item.applied ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-stone-400">
            <Icon icon={CheckCircle2} size={14} className="text-stone-300" />
            已发起对接
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onApply(item)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors duration-200"
          >
            发起对接申请
            <Icon icon={ChevronRight} size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Source item row ──────────────────────────────────────────────────────────

function SourceItem({
  title, typeLabel, selected, onClick,
}: {
  id: number; title: string; type: string; typeLabel: string
  selected: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left rounded-lg px-3 py-2.5 transition-all duration-150',
        selected
          ? 'bg-emerald-50 border border-emerald-200 shadow-sm'
          : 'hover:bg-stone-50 border border-transparent',
      ].join(' ')}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 inline-flex flex-shrink-0 h-2 w-2 rounded-full ${selected ? 'bg-emerald-500' : 'bg-stone-300'}`} />
        <div className="min-w-0">
          <p className="text-xs font-medium text-stone-800 line-clamp-2 leading-snug">{title}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">{typeLabel}</p>
        </div>
      </div>
    </button>
  )
}

// ─── Login prompt ─────────────────────────────────────────────────────────────

function LoginPrompt() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Icon icon={Sparkles} size={40} className="text-stone-200" />
      <p className="text-stone-500 text-sm">请先登录以使用智能推荐功能</p>
      <button
        type="button"
        onClick={() => navigate('/login')}
        className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
      >
        立即登录
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupplyRecommendPage() {
  const accountInfo = useAuthStore((s) => s.accountInfo)
  const [searchParams, setSearchParams] = useSearchParams()

  const [applyTarget, setApplyTarget] = useState<{ target: ApplyTarget; defaultSourceId?: number } | null>(null)

  const sourceType = (searchParams.get('sourceType') as 'RESOURCE' | 'DEMAND') ?? 'RESOURCE'
  const sourceId   = Number(searchParams.get('sourceId')) || 0
  const page       = Number(searchParams.get('page')) || 1

  const [activeTab, setActiveTab] = useState<'RESOURCE' | 'DEMAND'>(sourceType)

  const setParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(updates)) {
          if (v === undefined) next.delete(k)
          else next.set(k, v)
        }
        return next
      })
    },
    [setSearchParams],
  )

  // Load my resources and demands (all approved, no paging needed for the selector)
  const { data: myResources, isLoading: resLoading } = useMyResources(
    { page: 1, size: 50, auditStatus: 1 },
  )
  const { data: myDemands, isLoading: demLoading } = useMyDemands(
    { page: 1, size: 50, auditStatus: 1 },
  )

  const sourceList: Array<ResourceItem | DemandItem> = activeTab === 'RESOURCE'
    ? (myResources?.records ?? [])
    : (myDemands?.records ?? [])
  const sourceLoading = activeTab === 'RESOURCE' ? resLoading : demLoading

  const hasSource = sourceId > 0

  const { data: recData, isLoading: recLoading, isError: recError } = useRecommendations(
    { sourceType: activeTab, sourceId, page, size: PAGE_SIZE },
    !!accountInfo && hasSource,
  )

  function handleTabChange(tab: 'RESOURCE' | 'DEMAND') {
    setActiveTab(tab)
    setParam({ sourceType: tab, sourceId: undefined, page: undefined })
  }

  function handleSourceSelect(id: number) {
    setParam({ sourceType: activeTab, sourceId: String(id), page: undefined })
  }

  function handlePage(p: number) {
    setParam({ page: String(p) })
  }

  function handleApply(item: RecommendItem) {
    setApplyTarget({
      target: {
        type: item.targetType as 'RESOURCE' | 'DEMAND',
        id: item.targetId,
        title: item.targetTitle,
      },
      defaultSourceId: sourceId > 0 ? sourceId : undefined,
    })
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <PortalNav />

      {/* Page header */}
      <div className="bg-white border-b border-stone-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon icon={Sparkles} size={20} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900">智能推荐</h1>
              <p className="text-xs text-stone-400 mt-0.5">基于行业标签与地域相近度为您精准匹配供需</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {applyTarget && (
          <ApplyMatchDialog
            key={`${applyTarget.target.type}-${applyTarget.target.id}`}
            target={applyTarget.target}
            defaultSourceId={applyTarget.defaultSourceId}
            onClose={() => setApplyTarget(null)}
          />
        )}

        {!accountInfo ? (
          <LoginPrompt />
        ) : (
          <div className="flex gap-6 items-start">
            {/* ── Left: source selector ── */}
            <aside className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 sticky top-24 gap-3">
              <div className="rounded-xl border border-stone-100 bg-white shadow-card overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-stone-100">
                  {(['RESOURCE', 'DEMAND'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => handleTabChange(tab)}
                      className={[
                        'flex-1 py-3 text-xs font-semibold transition-colors duration-150',
                        activeTab === tab
                          ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500'
                          : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50',
                      ].join(' ')}
                    >
                      {tab === 'RESOURCE' ? '我的资源' : '我的需求'}
                    </button>
                  ))}
                </div>

                {/* Source list */}
                <div className="p-2 max-h-[60vh] overflow-y-auto space-y-1">
                  {sourceLoading ? (
                    <div className="flex justify-center py-6">
                      <Spinner size="sm" className="text-stone-300" />
                    </div>
                  ) : sourceList.length === 0 ? (
                    <p className="text-center text-xs text-stone-400 py-6">
                      暂无已审核通过的{activeTab === 'RESOURCE' ? '资源' : '需求'}
                    </p>
                  ) : (
                    sourceList.map((item) => (
                      <SourceItem
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        type={item.type}
                        typeLabel={
                          activeTab === 'RESOURCE'
                            ? (RESOURCE_TYPE_LABELS[item.type] ?? item.type)
                            : (DEMAND_TYPE_LABELS[item.type] ?? item.type)
                        }
                        selected={sourceId === item.id}
                        onClick={() => handleSourceSelect(item.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              <p className="text-[11px] text-stone-400 px-1 leading-relaxed">
                选择一个资源或需求，系统将从全库为您找到最匹配的对接对象
              </p>
            </aside>

            {/* ── Right: recommendation results ── */}
            <main className="flex-1 min-w-0">
              {/* Mobile source selector */}
              <div className="lg:hidden mb-4 rounded-xl border border-stone-100 bg-white shadow-card overflow-hidden">
                <div className="flex border-b border-stone-100">
                  {(['RESOURCE', 'DEMAND'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => handleTabChange(tab)}
                      className={[
                        'flex-1 py-2.5 text-xs font-semibold transition-colors duration-150',
                        activeTab === tab
                          ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500'
                          : 'text-stone-500 hover:text-stone-700',
                      ].join(' ')}
                    >
                      {tab === 'RESOURCE' ? '我的资源' : '我的需求'}
                    </button>
                  ))}
                </div>
                <div className="p-2 max-h-40 overflow-y-auto space-y-1">
                  {sourceLoading ? (
                    <div className="flex justify-center py-4">
                      <Spinner size="sm" className="text-stone-300" />
                    </div>
                  ) : sourceList.length === 0 ? (
                    <p className="text-center text-xs text-stone-400 py-4">
                      暂无已审核通过的{activeTab === 'RESOURCE' ? '资源' : '需求'}
                    </p>
                  ) : (
                    sourceList.map((item) => (
                      <SourceItem
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        type={item.type}
                        typeLabel={
                          activeTab === 'RESOURCE'
                            ? (RESOURCE_TYPE_LABELS[item.type] ?? item.type)
                            : (DEMAND_TYPE_LABELS[item.type] ?? item.type)
                        }
                        selected={sourceId === item.id}
                        onClick={() => handleSourceSelect(item.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Result area */}
              {!hasSource ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-white py-20 gap-3">
                  <Icon icon={Sparkles} size={36} className="text-stone-200" />
                  <p className="text-stone-400 text-sm">请从左侧选择一个资源或需求</p>
                </div>
              ) : recLoading ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <RecommendSkeletonCard key={i} />
                  ))}
                </div>
              ) : recError ? (
                <ErrorState description="推荐数据加载失败，请稍后重试" />
              ) : !recData || recData.records.length === 0 ? (
                <EmptyState
                  title="暂无推荐结果"
                  description="当前还没有与您高度匹配的供需，请丰富资源/需求标签以提升匹配精度"
                />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-stone-500">
                      共 <span className="font-semibold text-stone-800">{recData.total}</span> 个匹配结果
                    </p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {recData.records.map((item) => (
                      <RecommendCard
                        key={`${item.targetType}-${item.targetId}`}
                        item={item}
                        onApply={handleApply}
                      />
                    ))}
                  </div>

                  {recData.pages > 1 && (
                    <div className="mt-6">
                      <Pagination
                        page={page}
                        total={Number(recData.total)}
                        size={PAGE_SIZE}
                        onChange={handlePage}
                      />
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  )
}
