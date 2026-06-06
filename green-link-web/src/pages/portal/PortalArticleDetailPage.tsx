import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { PortalNav } from '@/business/PortalNav'
import { Spinner } from '@/components/Spinner'
import { ErrorState } from '@/components/states/ErrorState'
import { usePublicArticleDetail } from '@/services/articleService'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeLinkUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  try {
    const { protocol } = new URL(url)
    return protocol === 'http:' || protocol === 'https:' ? url : undefined
  } catch {
    return undefined
  }
}

// ─── Reading Progress Bar ─────────────────────────────────────────────────────

function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function update() {
      const el = document.documentElement
      const scrolled = el.scrollTop
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 pointer-events-none">
      <div
        className="h-full bg-emerald-500 transition-[width] duration-75 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

// ─── Meta Row ─────────────────────────────────────────────────────────────────

function formatDateTime(s: string | null): string {
  if (!s) return ''
  return s.slice(0, 16).replace('T', ' ')
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PortalArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const articleId = id ? Number(id) : null

  const { data: article, isLoading, isError } = usePublicArticleDetail(articleId)

  // Sanitize HTML once (content from Quill may contain arbitrary HTML)
  const sanitizedContent = useMemo(
    () => DOMPurify.sanitize(article?.content ?? ''),
    [article?.content],
  )

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col bg-theme-bg">
        <PortalNav />
        <div className="flex flex-1 items-center justify-center">
          <ErrorState
            title="文章不存在或已下架"
            description="您访问的文章可能已被删除或暂时无法查看"
            action={
              <button
                onClick={() => navigate(-1)}
                className="rounded-lg bg-theme-accent px-4 py-2 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200"
              >
                返回上一页
              </button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg">
      <ReadingProgressBar />
      <PortalNav />

      {isLoading || !article ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="lg" className="text-theme-accent" />
        </div>
      ) : (
        <main className="flex-1">
          {/* Hero / Title area */}
          <div className="bg-theme-surface border-b border-theme-border">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-xs text-stone-400 mb-4">
                <Link to="/portal" className="hover:text-theme-accent transition-colors duration-200">
                  首页
                </Link>
                <span>›</span>
                <Link to="/portal/articles" className="hover:text-theme-accent transition-colors duration-200">
                  资讯中心
                </Link>
                <span>›</span>
                <span className="text-stone-600">{article.categoryName}</span>
              </nav>

              {/* Category badge */}
              <div className="mb-3">
                <span className="inline-block rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 border border-emerald-200">
                  {article.categoryName}
                </span>
                {article.isTop && (
                  <span className="ml-2 inline-block rounded-md bg-red-50 text-red-600 text-xs font-medium px-2.5 py-1 border border-red-200">
                    置顶
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-theme-text-main leading-snug">
                {article.title}
              </h1>

              {/* Meta */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-stone-500">
                {article.author && (
                  <span className="flex items-center gap-1">
                    <span className="text-stone-400">作者</span>
                    <span className="font-medium text-stone-700">{article.author}</span>
                  </span>
                )}
                {article.publishedAt && (
                  <span className="flex items-center gap-1">
                    <span className="text-stone-400">发布时间</span>
                    <span>{formatDateTime(article.publishedAt)}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="text-stone-400">阅读</span>
                  <span>{article.viewCount}</span>
                </span>
                {safeLinkUrl(article.sourceUrl) && (
                  <a
                    href={safeLinkUrl(article.sourceUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-theme-accent hover:text-theme-accent-hover transition-colors duration-200"
                  >
                    <span>查看原文 →</span>
                  </a>
                )}
              </div>

              {/* Summary */}
              {article.summary && (
                <p className="mt-4 rounded-lg bg-stone-50 border-l-4 border-emerald-400 px-4 py-3 text-sm text-stone-600 leading-relaxed">
                  {article.summary}
                </p>
              )}

              {/* Cover image */}
              {article.coverUrl && (
                <div className="mt-6 overflow-hidden rounded-xl">
                  <img
                    src={article.coverUrl}
                    alt={article.title}
                    className="w-full object-cover max-h-96"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Article body */}
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
            {sanitizedContent ? (
              <article
                className="article-content"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            ) : (
              <p className="text-stone-400 text-sm">暂无正文内容</p>
            )}

            {/* Back / Footer actions */}
            <div className="mt-12 flex items-center justify-between border-t border-theme-border pt-6">
              <Link
                to="/portal/articles"
                className="flex items-center gap-1 text-sm text-theme-accent hover:text-theme-accent-hover transition-colors duration-200 font-medium"
              >
                ← 返回资讯列表
              </Link>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors duration-200"
              >
                回到顶部 ↑
              </button>
            </div>
          </div>
        </main>
      )}

      <footer className="bg-stone-900 text-stone-400 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs">
          © 2024 山东省绿色低碳产业协会 · 绿产智链平台
        </div>
      </footer>
    </div>
  )
}
