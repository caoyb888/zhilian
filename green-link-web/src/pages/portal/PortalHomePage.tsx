import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, CalendarDays, ChevronLeft, ChevronRight, Monitor, Sun, Moon } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { Badge, type BadgeVariant } from '@/components/Badge'
import { EmptyState } from '@/components/states/EmptyState'
import { PortalNav } from '@/business/PortalNav'
import { useThemeStore } from '@/stores/themeStore'
import type { ThemeKey } from '@/styles/themeSchema'
import {
  usePortalBanners,
  usePortalLatestArticles,
  usePortalLatestActivities,
  type BannerItem,
} from '@/services/portalHomeService'
import type { ArticleItem } from '@/services/articleService'
import type { Activity } from '@/services/activityService'
import { ACTIVITY_STATUS_MAP } from '@/services/activityService'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeLinkUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  try {
    const { protocol } = new URL(url)
    return protocol === 'http:' || protocol === 'https:' ? url : undefined
  } catch {
    return undefined
  }
}

const CATEGORY_VARIANT_MAP: Record<string, BadgeVariant> = {
  '新闻': 'news',
  '通知': 'notice',
  '政策': 'policy',
  '活动': 'activity',
}

// ─── Banner Carousel ──────────────────────────────────────────────────────────

const PLACEHOLDER_BANNERS: BannerItem[] = [
  {
    id: 0,
    title: '绿产智链 — 山东省绿色低碳产业智慧对接平台',
    imageUrl: null,
    linkUrl: null,
    sortOrder: 0,
  },
]

function BannerCarousel({ banners }: { banners: BannerItem[] }) {
  const items = banners.length > 0 ? banners : PLACEHOLDER_BANNERS
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startTimer() {
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % items.length)
    }, 5000)
  }

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    startTimer()
  }

  useEffect(() => {
    if (items.length <= 1) return
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [items.length])

  function prev() {
    setCurrent((c) => (c - 1 + items.length) % items.length)
    resetTimer()
  }
  function next() {
    setCurrent((c) => (c + 1) % items.length)
    resetTimer()
  }

  const item = items[current]

  return (
    <section className="relative h-[420px] sm:h-[500px] overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-emerald-500">
      {/* Grid texture */}
      <div
        className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none"
        aria-hidden="true"
      />

      {/* Background image */}
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          key={item.id}
        />
      )}
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 text-xs text-white/90 mb-4 transition-all duration-200">
          山东省绿色低碳产业协会官方平台
        </div>
        <h1 className="max-w-3xl text-2xl sm:text-4xl font-bold text-white leading-snug drop-shadow-md">
          {item.title}
        </h1>
        <div className="mt-8 flex gap-4">
          {safeLinkUrl(item.linkUrl) ? (
            <a
              href={safeLinkUrl(item.linkUrl)}
              rel="noopener noreferrer"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] px-6 py-3 text-base bg-white text-brand-700 hover:bg-brand-50 shadow-lg"
            >
              了解详情
            </a>
          ) : (
            <Link
              to="/portal/articles"
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] px-6 py-3 text-base bg-white text-brand-700 hover:bg-brand-50 shadow-lg"
            >
              浏览资讯
            </Link>
          )}
          <Link
            to="/supply"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] px-6 py-3 text-base border border-white/30 text-white hover:bg-white/10 hover:text-white"
          >
            供需对接
          </Link>
        </div>
      </div>

      {/* Arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="上一张"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-all duration-200"
          >
            <Icon icon={ChevronLeft} size={20} />
          </button>
          <button
            onClick={next}
            aria-label="下一张"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-all duration-200"
          >
            <Icon icon={ChevronRight} size={20} />
          </button>
        </>
      )}

      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-5 left-0 right-0 z-10 flex justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); resetTimer() }}
              aria-label={`第${i + 1}张`}
              className={[
                'h-2 rounded-full transition-all duration-300',
                i === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70',
              ].join(' ')}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Stat Bar ─────────────────────────────────────────────────────────────────

const STATS = [
  { label: '会员单位', value: '200+' },
  { label: '发布资源', value: '1,500+' },
  { label: '成功对接', value: '800+' },
  { label: '覆盖城市', value: '16' },
]

function StatBar() {
  return (
    <div className="bg-brand-600 text-white shadow-card">
      <div className="mx-auto max-w-7xl px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATS.map(({ label, value }) => (
          <div key={label} className="text-center transition-all duration-200 hover:scale-[1.02]">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-brand-200 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Article Card ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

function ArticleCard({ article }: { article: ArticleItem }) {
  const variant = CATEGORY_VARIANT_MAP[article.categoryName ?? ''] ?? 'default'

  return (
    <Link
      to={`/portal/articles/${article.id}`}
      className="group flex flex-col rounded-xl border border-stone-100 bg-white shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Cover */}
      <div className="h-40 bg-gradient-to-br from-brand-50 to-emerald-100 overflow-hidden">
        {article.coverUrl ? (
          <img
            src={article.coverUrl}
            alt={article.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-300 text-4xl font-bold select-none">
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
          {article.title}
        </h3>
        {article.summary && (
          <p className="mt-1.5 text-xs text-stone-500 line-clamp-2 flex-1">{article.summary}</p>
        )}
        <div className="mt-3 flex items-center justify-between text-xs text-stone-400">
          <span>{article.author ?? '协会编辑'}</span>
          <span>{formatDate(article.publishedAt)}</span>
        </div>
      </div>
    </Link>
  )
}

// ─── Activity Card ────────────────────────────────────────────────────────────

function ActivityCard({ activity }: { activity: Activity }) {
  const statusMeta = ACTIVITY_STATUS_MAP[activity.status] ?? { label: '未知', color: 'bg-gray-100 text-gray-500' }

  return (
    <Link
      to={`/portal/activities/${activity.id}`}
      className="group flex flex-col rounded-xl border border-stone-100 bg-white shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Cover */}
      <div className="h-36 bg-gradient-to-br from-emerald-50 to-teal-100 overflow-hidden">
        {activity.coverUrl ? (
          <img
            src={activity.coverUrl}
            alt={activity.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-teal-300 select-none">
            <Icon icon={CalendarDays} size={32} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <span className={`self-start rounded text-xs font-medium px-2 py-0.5 mb-2 ${statusMeta.color}`}>
          {statusMeta.label}
        </span>
        <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 group-hover:text-theme-accent transition-colors duration-200">
          {activity.title}
        </h3>
        <div className="mt-2 space-y-1 text-xs text-stone-500">
          {activity.location && (
            <div className="flex items-center gap-1">
              <Icon icon={MapPin} size={14} className="text-stone-400" />
              <span className="truncate">{activity.location}</span>
            </div>
          )}
          {activity.startTime && (
            <div className="flex items-center gap-1">
              <Icon icon={Calendar} size={14} className="text-stone-400" />
              <span>{formatDate(activity.startTime)}</span>
            </div>
          )}
        </div>
        {activity.maxCapacity && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-stone-400 mb-1">
              <span>报名人数</span>
              <span>{activity.regCount} / {activity.maxCapacity}</span>
            </div>
            <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (activity.regCount / activity.maxCapacity) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}

// ─── Section Skeleton ─────────────────────────────────────────────────────────

function CardSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-stone-100 bg-white overflow-hidden animate-pulse shadow-card">
          <div className="h-40 bg-stone-100" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-16 bg-stone-100 rounded" />
            <div className="h-4 w-full bg-stone-100 rounded" />
            <div className="h-3 w-3/4 bg-stone-100 rounded" />
          </div>
        </div>
      ))}
    </>
  )
}

// ─── Latest News Section ──────────────────────────────────────────────────────

function LatestNewsSection() {
  const { data: articles, isLoading } = usePortalLatestArticles(6)

  return (
    <section className="py-14 bg-theme-bg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-theme-text-main">最新资讯</h2>
            <p className="text-sm text-theme-text-muted mt-1">绿色低碳行业动态、政策解读与协会通知</p>
          </div>
          <Link
            to="/portal/articles"
            className="text-sm font-medium text-theme-accent hover:text-theme-accent-hover flex items-center gap-1 transition-all duration-200"
          >
            查看全部 →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <CardSkeleton count={6} />
          ) : articles && articles.length > 0 ? (
            articles.map((a) => <ArticleCard key={a.id} article={a} />)
          ) : (
            <div className="col-span-full">
              <EmptyState icon={CalendarDays} title="暂无发布资讯" description="敬请关注后续更新" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── Activities Section ───────────────────────────────────────────────────────

function ActivitiesSection() {
  const { data: activities, isLoading } = usePortalLatestActivities(4)

  return (
    <section className="py-14 bg-theme-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-theme-text-main">近期活动</h2>
            <p className="text-sm text-theme-text-muted mt-1">绿色产业交流会议、对接展览与培训活动</p>
          </div>
          <Link
            to="/portal/activities"
            className="text-sm font-medium text-theme-accent hover:text-theme-accent-hover flex items-center gap-1 transition-all duration-200"
          >
            查看全部 →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {isLoading ? (
            <CardSkeleton count={4} />
          ) : activities && activities.length > 0 ? (
            activities.map((a) => <ActivityCard key={a.id} activity={a} />)
          ) : (
            <div className="col-span-full">
              <EmptyState icon={CalendarDays} title="暂无近期活动" description="敬请关注后续更新" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── Supply CTA Section ───────────────────────────────────────────────────────

function SupplyCtaSection() {
  return (
    <section className="bg-gradient-to-r from-brand-600 to-emerald-600 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          发布供需，智能匹配合作伙伴
        </h2>
        <p className="text-brand-100 text-sm sm:text-base max-w-xl mx-auto mb-8">
          注册成为会员，发布绿色低碳资源或需求，平台将为您智能推荐最佳合作对象
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] px-6 py-3 text-base bg-white text-brand-600 hover:bg-brand-50 shadow"
          >
            免费注册会员
          </Link>
          <Link
            to="/supply"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] px-6 py-3 text-base border border-white/50 text-white hover:bg-white/10 hover:text-white"
          >
            浏览供需信息
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function ThemeDemoBar() {
  const { currentTheme, setTheme } = useThemeStore()
  const themes: { id: ThemeKey; label: string; icon: typeof Monitor }[] = [
    { id: 'nordic', label: '北欧绿', icon: Sun },
    { id: 'office', label: '蔚蓝商务', icon: Monitor },
    { id: 'tech', label: '极客暗色', icon: Moon },
  ]

  return (
    <section className="border-t border-stone-200 bg-stone-50 py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-stone-500">
            🎨 主题风格体验（演示）— 实时切换三种设计令牌
          </p>
          <div className="flex items-center gap-2">
            {themes.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={[
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200',
                  currentTheme === id
                    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:bg-stone-50',
                ].join(' ')}
              >
                <Icon icon={icon} size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function PortalFooter() {
  return (
    <footer className="bg-stone-900 text-stone-400 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">绿</span>
            </div>
            <span className="text-white font-semibold text-sm">绿产智链</span>
          </div>
          <p className="text-xs text-center">
            © 2024 山东省绿色低碳产业协会 · 绿产智链平台 · 鲁ICP备XXXXXXXX号
          </p>
          <div className="flex gap-4 text-xs">
            <a href="#" className="hover:text-white transition-colors duration-200">关于我们</a>
            <a href="#" className="hover:text-white transition-colors duration-200">联系方式</a>
            <a href="#" className="hover:text-white transition-colors duration-200">隐私政策</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PortalHomePage() {
  const { data: banners } = usePortalBanners()

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg">
      <PortalNav />
      <main className="flex-1">
        <BannerCarousel banners={banners ?? []} />
        <StatBar />
        <LatestNewsSection />
        <ActivitiesSection />
        <SupplyCtaSection />
      </main>
      <ThemeDemoBar />
      <PortalFooter />
    </div>
  )
}
