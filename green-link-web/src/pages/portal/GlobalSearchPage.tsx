import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search, Newspaper, Layers, FileSearch, ChevronRight, X,
  CalendarDays, type LucideIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import DOMPurify from 'dompurify'
import http from '@/services/http'
import { RESOURCE_TYPE_LABELS, DEMAND_TYPE_LABELS } from '@/services/supplyService'
import { Icon } from '@/components/Icon'
import { Spinner } from '@/components/Spinner'
import { PortalNav } from '@/business/PortalNav'
import type { ApiResult } from '@/types/api'
import type { ArticleItem, MbPage } from '@/services/articleService'
import type { ResourceItem, DemandItem } from '@/services/supplyService'

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_LENGTH = 2
const OVERVIEW_SIZE = 5
const DETAIL_SIZE = 20

const TABS = [
  { key: 'all',      label: '全部' },
  { key: 'article',  label: '资讯' },
  { key: 'resource', label: '资源' },
  { key: 'demand',   label: '需求' },
] as const

type TabKey = (typeof TABS)[number]['key']

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useArticleSearch(keyword: string, size: number) {
  return useQuery({
    queryKey: ['search', 'articles', keyword, size],
    queryFn: async () => {
      const res = await http.get<ApiResult<MbPage<ArticleItem>>>('/portal/articles', {
        params: { keyword, page: 1, size, published: true },
      })
      return res.data.data
    },
    enabled: keyword.length >= MIN_LENGTH,
    staleTime: 30_000,
  })
}

function useResourceSearch(keyword: string, size: number) {
  return useQuery({
    queryKey: ['search', 'resources', keyword, size],
    queryFn: async () => {
      const res = await http.get<ApiResult<MbPage<ResourceItem>>>('/supply/resources', {
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
    queryKey: ['search', 'demands', keyword, size],
    queryFn: async () => {
      const res = await http.get<ApiResult<MbPage<DemandItem>>>('/supply/demands', {
        params: { keyword, page: 1, size },
      })
      return res.data.data
    },
    enabled: keyword.length >= MIN_LENGTH,
    staleTime: 30_000,
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon icon={IconComp} size={16} className="text-emerald-600" />
        <span className="text-sm font-semibold text-stone-700">{title}</span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">{total}</span>
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

function TypeBadge({ label }: { label: string }) {
  return (
    <span className="shrink-0 inline-block rounded px-1.5 py-0.5 text-xs font-medium bg-stone-100 text-stone-500">
      {label}
    </span>
  )
}

function ArticleCard({ item }: { item: ArticleItem }) {
  return (
    <Link
      to={`/portal/articles/${item.id}`}
      className="flex items-start gap-3 rounded-xl border border-stone-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        <Icon icon={Newspaper} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="truncate text-sm font-medium text-stone-800"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(item.highlightTitle ?? item.title),
            }}
          />
          {item.categoryName && <TypeBadge label={item.categoryName} />}
        </div>
        {(item.highlightSummary ?? item.summary) && (
          <p
            className="mt-0.5 line-clamp-2 text-xs text-stone-500"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(item.highlightSummary ?? item.summary ?? ''),
            }}
          />
        )}
        {item.publishedAt && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-stone-400">
            <Icon icon={CalendarDays} size={11} />
            {item.publishedAt.slice(0, 10)}
          </div>
        )}
      </div>
    </Link>
  )
}

function ResourceCard({ item }: { item: ResourceItem }) {
  return (
    <Link
      to={`/supply/resources/${item.id}`}
      className="flex items-start gap-3 rounded-xl border border-stone-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
        <Icon icon={Layers} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="truncate text-sm font-medium text-stone-800"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(item.highlightTitle ?? item.title),
            }}
          />
          <TypeBadge label={RESOURCE_TYPE_LABELS[item.type] ?? item.type} />
        </div>
        {(item.highlightSummary ?? item.summary) && (
          <p
            className="mt-0.5 line-clamp-2 text-xs text-stone-500"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(item.highlightSummary ?? item.summary ?? ''),
            }}
          />
        )}
      </div>
    </Link>
  )
}

function DemandCard({ item }: { item: DemandItem }) {
  return (
    <Link
      to={`/supply/demands/${item.id}`}
      className="flex items-start gap-3 rounded-xl border border-stone-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
        <Icon icon={FileSearch} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="truncate text-sm font-medium text-stone-800"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(item.highlightTitle ?? item.title),
            }}
          />
          <TypeBadge label={DEMAND_TYPE_LABELS[item.type] ?? item.type} />
        </div>
        {(item.highlightSummary ?? item.summary) && (
          <p
            className="mt-0.5 line-clamp-2 text-xs text-stone-500"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(item.highlightSummary ?? item.summary ?? ''),
            }}
          />
        )}
      </div>
    </Link>
  )
}

function EmptyResults({ keyword }: { keyword: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-stone-400">
      <Icon icon={Search} size={44} className="opacity-20" />
      <p className="text-sm">未找到与「{keyword}」相关的结果</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GlobalSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const initialQ   = searchParams.get('q') ?? ''
  const initialTab = (searchParams.get('tab') as TabKey | null) ?? 'all'

  const [inputValue, setInputValue] = useState(initialQ)
  const [keyword,    setKeyword]    = useState(initialQ)
  const [activeTab,  setActiveTab]  = useState<TabKey>(initialTab)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  const articleSize  = activeTab === 'article'  ? DETAIL_SIZE : OVERVIEW_SIZE
  const resourceSize = activeTab === 'resource' ? DETAIL_SIZE : OVERVIEW_SIZE
  const demandSize   = activeTab === 'demand'   ? DETAIL_SIZE : OVERVIEW_SIZE

  const articleQuery  = useArticleSearch(keyword,  articleSize)
  const resourceQuery = useResourceSearch(keyword, resourceSize)
  const demandQuery   = useDemandSearch(keyword,   demandSize)

  const isAnyLoading = articleQuery.isLoading || resourceQuery.isLoading || demandQuery.isLoading

  // Debounce input → keyword + URL sync
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const q = inputValue.trim()
      setKeyword(q)
      const params: Record<string, string> = {}
      if (q) params.q = q
      if (activeTab !== 'all') params.tab = activeTab
      setSearchParams(params, { replace: true })
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [inputValue, activeTab, setSearchParams])

  // Tab change syncs URL
  useEffect(() => {
    const params: Record<string, string> = {}
    if (keyword) params.q = keyword
    if (activeTab !== 'all') params.tab = activeTab
    setSearchParams(params, { replace: true })
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Ctrl+K / Cmd+K refocuses the input on this page
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Auto-focus on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  const articles  = articleQuery.data?.records  ?? []
  const resources = resourceQuery.data?.records ?? []
  const demands   = demandQuery.data?.records   ?? []

  const articleTotal  = articleQuery.data?.total  ?? 0
  const resourceTotal = resourceQuery.data?.total ?? 0
  const demandTotal   = demandQuery.data?.total   ?? 0

  const hasResults = articles.length + resources.length + demands.length > 0
  const searched   = keyword.length >= MIN_LENGTH

  return (
    <>
      <PortalNav />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* 页头 */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-stone-800">全局搜索</h1>
          <p className="mt-1 text-sm text-stone-500">搜索平台资讯、供给资源、采购需求</p>
        </div>

        {/* 搜索框 */}
        <div className="relative mb-4">
          <Icon
            icon={Search}
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            ref={inputRef}
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入关键词搜索（至少 2 个字）"
            className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-10 pr-10 text-sm text-stone-800 shadow-sm outline-none transition-colors placeholder:text-stone-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
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
          <div className="mb-5 flex gap-1 border-b border-stone-200">
            {TABS.map((t) => {
              const count =
                t.key === 'article'  ? articleTotal  :
                t.key === 'resource' ? resourceTotal :
                t.key === 'demand'   ? demandTotal   :
                articleTotal + resourceTotal + demandTotal
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
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
          <div className="flex flex-col items-center gap-3 py-20 text-stone-400">
            <Icon icon={Search} size={48} className="opacity-20" />
            <p className="text-sm">请输入至少 2 个字开始搜索</p>
            <p className="text-xs text-stone-300">可搜索协会资讯、绿色资源、采购需求</p>
          </div>
        ) : isAnyLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" className="text-emerald-500" />
          </div>
        ) : !hasResults ? (
          <EmptyResults keyword={keyword} />
        ) : (
          <div className="flex flex-col gap-6">
            {(activeTab === 'all' || activeTab === 'article') && articles.length > 0 && (
              <section>
                <SectionHeader
                  icon={Newspaper}
                  title="平台资讯"
                  total={articleTotal}
                  onViewAll={activeTab === 'all' ? () => setActiveTab('article') : undefined}
                />
                <div className="flex flex-col gap-2">
                  {articles.map((a) => <ArticleCard key={a.id} item={a} />)}
                </div>
              </section>
            )}

            {(activeTab === 'all' || activeTab === 'resource') && resources.length > 0 && (
              <section>
                <SectionHeader
                  icon={Layers}
                  title="供给资源"
                  total={resourceTotal}
                  onViewAll={activeTab === 'all' ? () => setActiveTab('resource') : undefined}
                />
                <div className="flex flex-col gap-2">
                  {resources.map((r) => <ResourceCard key={r.id} item={r} />)}
                </div>
              </section>
            )}

            {(activeTab === 'all' || activeTab === 'demand') && demands.length > 0 && (
              <section>
                <SectionHeader
                  icon={FileSearch}
                  title="采购需求"
                  total={demandTotal}
                  onViewAll={activeTab === 'all' ? () => setActiveTab('demand') : undefined}
                />
                <div className="flex flex-col gap-2">
                  {demands.map((d) => <DemandCard key={d.id} item={d} />)}
                </div>
              </section>
            )}
          </div>
        )}

        {/* 分页提示（单 tab 详情模式） */}
        {searched && activeTab !== 'all' && (() => {
          const total =
            activeTab === 'article'  ? articleTotal  :
            activeTab === 'resource' ? resourceTotal : demandTotal
          const shown =
            activeTab === 'article'  ? articles.length  :
            activeTab === 'resource' ? resources.length : demands.length
          if (total > shown) {
            return (
              <p className="mt-4 text-center text-xs text-stone-400">
                共 {total} 条，当前显示前 {shown} 条，请缩短关键词以获取更精确结果
              </p>
            )
          }
          return null
        })()}
      </main>
    </>
  )
}
