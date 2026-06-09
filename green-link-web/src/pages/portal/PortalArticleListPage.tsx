import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { Search, User, Eye, CalendarDays, Flame } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Badge, type BadgeVariant } from '@/components/Badge'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { SkeletonCard } from '@/components/states/SkeletonCard'
import { PortalNav } from '@/business/PortalNav'
import { Pagination } from '@/components/Pagination'
import { usePublicArticleList, usePortalCategories } from '@/services/articleService'
import type { ArticleItem, CategoryItem } from '@/services/articleService'

const PAGE_SIZE = 12

// ─── Highlight-aware text render ──────────────────────────────────────────────

function HighlightHtml({ html, fallback }: { html: string | null; fallback: string }) {
  if (!html) return <>{fallback}</>
  return (
    <span
      className="highlight"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, { ALLOWED_TAGS: ['em'] }) }}
    />
  )
}

// ─── Category variant mapping ─────────────────────────────────────────────────

const CODE_VARIANT_MAP: Record<string, BadgeVariant> = {
  'NEWS': 'news',
  'NOTICE': 'notice',
  'POLICY': 'policy',
  'ACTIVITY': 'activity',
}

// ─── Article Card ─────────────────────────────────────────────────────────────

function formatDate(s: string | null) {
  return s ? s.slice(0, 10) : ''
}

function ArticleCard({
  article,
  categoryCode,
  featured = false,
}: {
  article: ArticleItem
  categoryCode?: string
  featured?: boolean
}) {
  const variant = CODE_VARIANT_MAP[categoryCode ?? ''] ?? 'default'

  return (
    <Link
      to={`/portal/articles/${article.id}`}
      className={[
        'group flex flex-col overflow-hidden bg-white',
        'border border-stone-200/80',
        'rounded-2xl shadow-sm',
        'hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-900/5',
        'hover:-translate-y-0.5 transition-all duration-300',
        featured ? 'lg:col-span-2' : '',
      ].join(' ')}
    >
      {/* Cover */}
      <div
        className={[
          'bg-gradient-to-br from-emerald-50 to-stone-100 overflow-hidden flex-shrink-0 relative',
          featured ? 'aspect-[21/9]' : 'aspect-[16/10]',
        ].join(' ')}
      >
        {article.coverUrl ? (
          <img
            src={article.coverUrl}
            alt={article.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center relative overflow-hidden">
            <img
              src="/lsdt-logo.png"
              alt=""
              className="absolute w-32 h-32 opacity-10 object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 to-stone-100/80" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {article.isTop && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200/60">
              <Icon icon={Flame} size={10} />
              置顶
            </span>
          )}
          <Badge
            variant={variant}
            className="rounded-full text-[11px] px-2 py-0.5"
          >
            {article.categoryName}
          </Badge>
        </div>

        <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 group-hover:text-theme-accent transition-colors duration-200">
          <HighlightHtml html={article.highlightTitle} fallback={article.title} />
        </h3>

        {(article.highlightSummary || article.summary) && (
          <p className="mt-1.5 text-xs text-stone-500 line-clamp-2 flex-1">
            <HighlightHtml
              html={article.highlightSummary}
              fallback={article.summary ?? ''}
            />
          </p>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <Icon icon={User} size={12} />
            {article.author ?? '协会编辑'}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Icon icon={Eye} size={12} />
              {article.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Icon icon={CalendarDays} size={12} />
              {formatDate(article.publishedAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Category Tabs ────────────────────────────────────────────────────────────

function flatTopLevel(cats: CategoryItem[]): CategoryItem[] {
  return cats.filter((c) => c.parentId === null && c.isVisible)
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PortalArticleListPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const categoryId = searchParams.get('categoryId')
    ? Number(searchParams.get('categoryId'))
    : undefined
  const keyword = searchParams.get('keyword') ?? ''
  const page = Number(searchParams.get('page')) || 1

  const [inputValue, setInputValue] = useState(keyword)
  const [prevKeyword, setPrevKeyword] = useState(keyword)
  if (prevKeyword !== keyword) {
    setPrevKeyword(keyword)
    setInputValue(keyword)
  }

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

  function handleCategoryChange(id: number | undefined) {
    setParam({ categoryId: id?.toString(), page: undefined })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setParam({ keyword: inputValue || undefined, page: undefined })
  }

  function handlePageChange(p: number) {
    setParam({ page: String(p) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const { data: categoryTree } = usePortalCategories()
  const topCategories = categoryTree ? flatTopLevel(categoryTree) : []

  // Build categoryId → code map for badge coloring
  const catCodeById = new Map(topCategories.map((c) => [c.id, c.code]))

  const { data, isLoading, isFetching, isError } = usePublicArticleList({
    page,
    size: PAGE_SIZE,
    categoryId,
    keyword: keyword || undefined,
    published: true,
  })

  const articles = data?.records ?? []
  const total = data?.total ?? 0

  // Determine if first article should be featured (top article in first page, no category filter, no keyword)
  const hasFeatured =
    !isLoading &&
    !isError &&
    articles.length > 0 &&
    page === 1 &&
    !categoryId &&
    !keyword &&
    articles[0]?.isTop

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg">
      <PortalNav />

      {/* Page header */}
      <div className="bg-gradient-to-b from-emerald-50/60 via-white to-white border-b border-theme-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          <h1 className="text-2xl font-bold text-theme-text-main tracking-tight">资讯中心</h1>
          <p className="mt-1 text-sm text-theme-text-muted">
            绿色低碳行业动态 · 政策解读 · 协会通知
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-5 flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                <Icon icon={Search} size={16} />
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="搜索文章…"
                className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-4 py-2.5 text-sm outline-none shadow-sm focus:border-theme-accent focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-theme-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-theme-accent-hover shadow-sm hover:shadow-md transition-all duration-200"
            >
              搜索
            </button>
            {keyword && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('')
                  setParam({ keyword: undefined, page: undefined })
                }}
                className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-500 hover:bg-stone-50 hover:border-stone-300 transition-all duration-200"
              >
                清除
              </button>
            )}
          </form>
        </div>

        {/* Category pills */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange(undefined)}
              className={[
                'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200',
                categoryId === undefined
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700',
              ].join(' ')}
            >
              全部
            </button>
            {topCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={[
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200',
                  categoryId === cat.id
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700',
                ].join(' ')}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Result count / keyword hint */}
        {keyword && !isLoading && (
          <p className="mb-5 text-sm text-stone-500">
            关键词 <span className="font-medium text-stone-800">"{keyword}"</span> 的搜索结果，共{' '}
            <span className="font-medium text-theme-accent">{total}</span> 篇
          </p>
        )}

        {/* Article grid */}
        <div
          className={[
            'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 transition-opacity duration-200',
            isFetching && !isLoading ? 'opacity-60' : '',
          ].join(' ')}
        >
          {isLoading ? (
            Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
          ) : isError ? (
            <div className="col-span-full">
              <ErrorState
                title="加载失败"
                description="文章列表加载异常，请检查网络或稍后重试"
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
          ) : articles.length > 0 ? (
            articles.map((a, idx) => (
              <ArticleCard
                key={a.id}
                article={a}
                categoryCode={catCodeById.get(a.categoryId)}
                featured={hasFeatured && idx === 0}
              />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState
                title={keyword ? '未找到相关文章' : '暂无资讯'}
                description={keyword ? '请换个关键词试试' : '当前栏目暂无文章，敬请关注后续更新'}
              />
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="mt-8 pt-6 border-t border-stone-100">
            <Pagination page={page} total={total} size={PAGE_SIZE} onChange={handlePageChange} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs">
          © 2024 山东省绿色低碳产业协会 · 绿产智链平台
        </div>
      </footer>
    </div>
  )
}
