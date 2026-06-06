import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
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

// ─── Article Card ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  NEWS: 'bg-blue-100 text-blue-700',
  NOTICE: 'bg-amber-100 text-amber-700',
  POLICY: 'bg-purple-100 text-purple-700',
  ACTIVITY: 'bg-brand-100 text-brand-700',
}

function formatDate(s: string | null) {
  return s ? s.slice(0, 10) : ''
}

function ArticleCard({ article }: { article: ArticleItem }) {
  const badgeColor =
    CATEGORY_COLORS[article.categoryName?.toUpperCase?.()] ?? 'bg-gray-100 text-gray-600'

  return (
    <Link
      to={`/portal/articles/${article.id}`}
      className="group flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-200 overflow-hidden"
    >
      {/* Cover */}
      <div className="h-44 bg-gradient-to-br from-brand-50 to-emerald-100 overflow-hidden flex-shrink-0">
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
            <span className="rounded text-xs font-medium bg-red-100 text-red-600 px-1.5 py-0.5">
              置顶
            </span>
          )}
          <span className={`rounded text-xs font-medium px-1.5 py-0.5 ${badgeColor}`}>
            {article.categoryName}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
          <HighlightHtml html={article.highlightTitle} fallback={article.title} />
        </h3>

        {(article.highlightSummary || article.summary) && (
          <p className="mt-1.5 text-xs text-gray-500 line-clamp-2 flex-1">
            <HighlightHtml
              html={article.highlightSummary}
              fallback={article.summary ?? ''}
            />
          </p>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonGrid({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-100 bg-white overflow-hidden animate-pulse"
        >
          <div className="h-44 bg-gray-100" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-16 bg-gray-100 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-3 w-3/4 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </>
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

  // Keep input in sync when URL changes (e.g. back navigation)
  useEffect(() => {
    setInputValue(keyword)
  }, [keyword])

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

  const { data, isLoading, isFetching } = usePublicArticleList({
    page,
    size: PAGE_SIZE,
    categoryId,
    keyword: keyword || undefined,
    published: true,
  })

  const articles = data?.records ?? []
  const total = data?.total ?? 0

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PortalNav />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900">资讯中心</h1>
          <p className="mt-1 text-sm text-gray-500">绿色低碳行业动态 · 政策解读 · 协会通知</p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-4 flex gap-2 max-w-lg">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="搜索文章…"
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
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
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
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
                'flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                categoryId === undefined
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ].join(' ')}
            >
              全部
            </button>
            {topCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={[
                  'flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  categoryId === cat.id
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
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
          <p className="mb-5 text-sm text-gray-500">
            关键词 <span className="font-medium text-gray-800">"{keyword}"</span> 的搜索结果，共{' '}
            <span className="font-medium text-brand-600">{total}</span> 篇
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
            <SkeletonGrid count={PAGE_SIZE} />
          ) : articles.length > 0 ? (
            articles.map((a) => <ArticleCard key={a.id} article={a} />)
          ) : (
            <div className="col-span-3 py-24 text-center text-gray-400 text-sm">
              {keyword ? '未找到相关文章，请换个关键词试试' : '暂无资讯'}
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
      <footer className="bg-gray-900 text-gray-400 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs">
          © 2024 山东省绿色低碳产业协会 · 绿产智链平台
        </div>
      </footer>
    </div>
  )
}
