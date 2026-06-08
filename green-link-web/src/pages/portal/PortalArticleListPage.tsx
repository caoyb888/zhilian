import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { Search } from 'lucide-react'
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

function ArticleCard({ article, categoryCode }: { article: ArticleItem; categoryCode?: string }) {
  const variant = CODE_VARIANT_MAP[categoryCode ?? ''] ?? 'default'

  return (
    <Link
      to={`/portal/articles/${article.id}`}
      className="group flex flex-col rounded-xl border border-stone-100 bg-white shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Cover */}
      <div className="aspect-[16/10] bg-gradient-to-br from-brand-50 to-emerald-100 overflow-hidden flex-shrink-0">
        {article.coverUrl ? (
          <img
            src={article.coverUrl}
            alt={article.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-200 text-5xl font-bold select-none">
            绿
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {article.isTop && (
            <Badge variant="error" className="text-[10px]">置顶</Badge>
          )}
          <Badge variant={variant} className="text-[10px]">
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
          <span>{article.author ?? '协会编辑'}</span>
          <div className="flex items-center gap-3">
            <span>{article.viewCount} 阅读</span>
            <span>{formatDate(article.publishedAt)}</span>
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

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg">
      <PortalNav />

      {/* Page header */}
      <div className="bg-theme-surface border-b border-theme-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-theme-text-main">资讯中心</h1>
          <p className="mt-1 text-sm text-theme-text-muted">绿色低碳行业动态 · 政策解读 · 协会通知</p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-4 flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                <Icon icon={Search} size={16} />
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="搜索文章…"
                className="w-full rounded-lg border border-stone-200 bg-white pl-9 pr-4 py-2 text-sm outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-theme-accent px-5 py-2 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200"
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
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-500 hover:bg-stone-50 hover:border-stone-300 transition-all duration-200"
              >
                清除
              </button>
            )}
          </form>
        </div>

        {/* Category tabs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto pb-0 -mb-px">
            <button
              onClick={() => handleCategoryChange(undefined)}
              className={[
                'flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200',
                categoryId === undefined
                  ? 'border-theme-accent text-theme-accent'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300',
              ].join(' ')}
            >
              全部
            </button>
            {topCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={[
                  'flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200',
                  categoryId === cat.id
                    ? 'border-theme-accent text-theme-accent'
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300',
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
            'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity duration-200',
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
            articles.map((a) => (
              <ArticleCard
                key={a.id}
                article={a}
                categoryCode={catCodeById.get(a.categoryId)}
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
          <div className="mt-8">
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
