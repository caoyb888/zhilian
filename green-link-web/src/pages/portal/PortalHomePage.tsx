import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin, Calendar, CalendarDays, ChevronLeft, ChevronRight,
  Monitor, Sun, Moon, ArrowRight, Building2, Layers, Handshake,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
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


function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

// ─── Hex SVG Decoration ───────────────────────────────────────────────────────
// Hexagons reference carbon-C6 rings and honeycomb — both central to green industry

function HexDeco({ className }: { className?: string }) {
  const hex = (cx: number, cy: number, r: number): string =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
    }).join(' ')

  return (
    <svg
      className={`pointer-events-none select-none ${className ?? ''}`}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon points={hex(920, 90, 210)}  fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.13" />
      <polygon points={hex(920, 90, 150)}  fill="none" stroke="currentColor" strokeWidth="1"   opacity="0.09" />
      <polygon points={hex(1300, 390, 95)} fill="none" stroke="currentColor" strokeWidth="1"   opacity="0.16" />
      <polygon points={hex(150, 490, 120)} fill="none" stroke="currentColor" strokeWidth="1"   opacity="0.08" />
      <polygon points={hex(500, 55,  42)}  fill="currentColor"                                 opacity="0.07" />
      <polygon points={hex(1180, 210, 26)} fill="currentColor"                                 opacity="0.11" />
    </svg>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  num,
  title,
  subtitle,
  linkTo,
}: {
  num: string
  title: string
  subtitle: string
  linkTo: string
}) {
  return (
    <div className="flex items-end gap-4 mb-10">
      <span className="text-[5rem] leading-none font-black text-emerald-500/[0.12] select-none tabular-nums shrink-0">
        {num}
      </span>
      <div className="pb-1.5 min-w-0">
        <h2 className="text-2xl font-bold text-theme-text-main leading-tight">{title}</h2>
        <p className="text-sm text-theme-text-muted mt-0.5">{subtitle}</p>
      </div>
      <div className="hidden lg:block flex-1 border-b border-dashed border-stone-200 mb-3 mx-2" />
      <Link
        to={linkTo}
        className="shrink-0 mb-2 inline-flex items-center gap-1 text-sm font-medium text-theme-accent hover:text-theme-accent-hover transition-colors duration-200"
      >
        查看全部 <Icon icon={ArrowRight} size={14} />
      </Link>
    </div>
  )
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
    timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % items.length), 5000)
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

  function prev() { setCurrent((c) => (c - 1 + items.length) % items.length); resetTimer() }
  function next() { setCurrent((c) => (c + 1) % items.length); resetTimer() }

  const item = items[current]

  return (
    <section className="relative h-[460px] sm:h-[540px] overflow-hidden bg-emerald-950">
      {/* Carbon-hexagon SVG decorations */}
      <HexDeco className="absolute inset-0 w-full h-full text-emerald-400" />

      {/* Left-to-right gradient so text stays readable over any background image */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/65 to-transparent" />

      {/* Background image (when set) */}
      {item.imageUrl && (
        <img
          key={item.id}
          src={item.imageUrl}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover opacity-25 transition-opacity duration-700"
        />
      )}

      {/* Content — editorial left-aligned layout */}
      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto max-w-7xl w-full px-6 sm:px-10 lg:px-16">
          <div className="flex items-stretch gap-5 max-w-2xl">
            {/* Vertical accent bar */}
            <div className="w-0.5 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500 shrink-0" />
            <div>
              <span className="inline-flex items-center rounded-md bg-emerald-500/15 border border-emerald-500/25 px-3 py-1 text-xs font-medium text-emerald-300 mb-5 tracking-wide">
                山东省绿色低碳产业协会官方平台
              </span>
              <h1 className="text-3xl sm:text-[2.6rem] font-extrabold text-white leading-tight tracking-tight">
                {item.title}
              </h1>
              <p className="mt-3 text-sm text-emerald-200/60 max-w-md leading-relaxed">
                汇聚绿色低碳资源，智能匹配供需对接，构建产业生态闭环
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {safeLinkUrl(item.linkUrl) ? (
                  <a
                    href={safeLinkUrl(item.linkUrl)}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/50 hover:bg-emerald-400 transition-all duration-200 active:scale-[0.98]"
                  >
                    了解详情 <Icon icon={ArrowRight} size={15} />
                  </a>
                ) : (
                  <Link
                    to="/portal/articles"
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/50 hover:bg-emerald-400 transition-all duration-200 active:scale-[0.98]"
                  >
                    浏览资讯 <Icon icon={ArrowRight} size={15} />
                  </Link>
                )}
                <Link
                  to="/supply"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/35 transition-all duration-200 active:scale-[0.98]"
                >
                  供需对接
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prev / Next */}
      {items.length > 1 && (
        <>
          <button onClick={prev} aria-label="上一张" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-all">
            <Icon icon={ChevronLeft} size={18} />
          </button>
          <button onClick={next} aria-label="下一张" className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-all">
            <Icon icon={ChevronRight} size={18} />
          </button>
        </>
      )}

      {/* Indicator dots */}
      {items.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); resetTimer() }}
              aria-label={`第${i + 1}张`}
              className={[
                'rounded-full transition-all duration-300',
                i === current ? 'w-6 h-1.5 bg-emerald-400' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/55',
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
  { label: '会员单位', value: '200', unit: '+', icon: Building2 },
  { label: '发布资源', value: '1,500', unit: '+', icon: Layers },
  { label: '成功对接', value: '800', unit: '+', icon: Handshake },
  { label: '覆盖城市', value: '16', unit: '座', icon: MapPin },
]

function StatBar() {
  return (
    <div className="bg-white border-t-[3px] border-t-emerald-500 shadow-md">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-stone-100">
          {STATS.map(({ label, value, unit, icon }) => (
            <div key={label} className="flex flex-col items-center justify-center py-6 px-4 hover:bg-emerald-50/40 transition-colors duration-200 cursor-default">
              <div className="flex items-end gap-0.5 leading-none">
                <span className="text-4xl font-black text-emerald-700 tabular-nums">{value}</span>
                <span className="text-base font-bold text-emerald-500 mb-0.5">{unit}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Icon icon={icon} size={12} className="text-stone-400" />
                <span className="text-xs text-stone-500 tracking-wide">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: ArticleItem }) {

  return (
    <Link
      to={`/portal/articles/${article.id}`}
      className="group flex flex-col rounded-2xl bg-white border border-stone-100 border-l-4 border-l-transparent hover:border-l-emerald-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Cover */}
      <div className="relative h-44 bg-gradient-to-br from-emerald-50 to-teal-100 overflow-hidden shrink-0">
        {article.coverUrl ? (
          <img
            src={article.coverUrl}
            alt={article.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-7xl font-black text-emerald-200/60 select-none">绿</span>
          </div>
        )}
        {/* Category + top badge overlaid on cover */}
        <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
          {article.isTop && (
            <span className="rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">置顶</span>
          )}
          {article.categoryName && (
            <span className="rounded bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
              {article.categoryName}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 group-hover:text-emerald-700 transition-colors duration-200 leading-snug">
          {article.title}
        </h3>
        {article.summary && (
          <p className="mt-2 text-xs text-stone-500 line-clamp-2 flex-1 leading-relaxed">
            {article.summary}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between text-xs text-stone-400 border-t border-stone-50 pt-3">
          <span className="truncate max-w-[60%]">{article.author ?? '协会编辑'}</span>
          <span className="shrink-0 tabular-nums">{formatDate(article.publishedAt)}</span>
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
      className="group flex flex-col rounded-2xl bg-white border border-stone-100 border-l-4 border-l-transparent hover:border-l-teal-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Cover */}
      <div className="relative h-40 bg-gradient-to-br from-teal-50 to-emerald-100 overflow-hidden shrink-0">
        {activity.coverUrl ? (
          <img
            src={activity.coverUrl}
            alt={activity.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon icon={CalendarDays} size={40} className="text-teal-200" />
          </div>
        )}
        <span className={`absolute top-3 right-3 rounded px-2 py-0.5 text-[10px] font-bold shadow-sm ${statusMeta.color}`}>
          {statusMeta.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 group-hover:text-teal-700 transition-colors duration-200 leading-snug">
          {activity.title}
        </h3>
        <div className="mt-2 space-y-1.5 text-xs text-stone-500 flex-1">
          {activity.location && (
            <div className="flex items-center gap-1.5">
              <Icon icon={MapPin} size={12} className="text-stone-400 shrink-0" />
              <span className="truncate">{activity.location}</span>
            </div>
          )}
          {activity.startTime && (
            <div className="flex items-center gap-1.5">
              <Icon icon={Calendar} size={12} className="text-stone-400 shrink-0" />
              <span>{formatDate(activity.startTime)}</span>
            </div>
          )}
        </div>
        {activity.maxCapacity && (
          <div className="mt-3 border-t border-stone-50 pt-3">
            <div className="flex justify-between text-xs text-stone-400 mb-1.5">
              <span>报名进度</span>
              <span className="tabular-nums font-medium text-emerald-600">
                {activity.regCount} / {activity.maxCapacity}
              </span>
            </div>
            <div className="h-1 rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-700"
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
        <div key={i} className="rounded-2xl border border-stone-100 bg-white overflow-hidden animate-pulse">
          <div className="h-44 bg-stone-100" />
          <div className="p-4 space-y-2.5">
            <div className="h-3 w-16 bg-stone-100 rounded-full" />
            <div className="h-4 w-full bg-stone-100 rounded-full" />
            <div className="h-3 w-3/4 bg-stone-100 rounded-full" />
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
    <section className="py-16 bg-theme-bg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          num="01"
          title="最新资讯"
          subtitle="绿色低碳行业动态、政策解读与协会通知"
          linkTo="/portal/articles"
        />
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
    <section className="py-16 bg-theme-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          num="02"
          title="近期活动"
          subtitle="绿色产业交流会议、对接展览与培训活动"
          linkTo="/portal/activities"
        />
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
    <section className="relative bg-emerald-950 py-20 overflow-hidden">
      <HexDeco className="absolute inset-0 w-full h-full text-emerald-600" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900/80 to-teal-950/90" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/25 px-4 py-1.5 text-xs font-medium text-emerald-300 mb-6 tracking-wide">
          智能供需对接平台
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
          发布供需，智能匹配<br className="hidden sm:block" />合作伙伴
        </h2>
        <p className="text-emerald-200/65 text-sm sm:text-base max-w-lg mx-auto mb-10 leading-relaxed">
          注册成为会员，发布绿色低碳资源或需求，平台将为您智能推荐最佳合作对象
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-950/60 hover:bg-emerald-400 transition-all duration-200 active:scale-[0.98]"
          >
            免费注册会员 <Icon icon={ArrowRight} size={16} />
          </Link>
          <Link
            to="/supply"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/30 transition-all duration-200 active:scale-[0.98]"
          >
            浏览供需信息
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Theme Demo Bar ───────────────────────────────────────────────────────────

function ThemeDemoBar() {
  const { currentTheme, setTheme } = useThemeStore()
  const themes: { id: ThemeKey; label: string; icon: typeof Monitor }[] = [
    { id: 'nordic', label: '北欧绿', icon: Sun },
    { id: 'office', label: '蔚蓝商务', icon: Monitor },
    { id: 'tech', label: '极客暗色', icon: Moon },
  ]

  return (
    <section className="border-t border-stone-200 bg-stone-50/80 py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-stone-400">
            主题风格体验（演示）— 实时切换三种设计令牌
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
                    : 'bg-white text-stone-500 border border-stone-200 hover:border-emerald-200 hover:text-emerald-700',
                ].join(' ')}
              >
                <Icon icon={icon} size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function PortalFooter() {
  return (
    <footer className="bg-stone-950 text-stone-500 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-900/50">
              <span className="text-white text-xs font-bold">绿</span>
            </div>
            <div>
              <span className="text-white font-bold text-sm">绿产智链</span>
              <span className="ml-2 text-stone-600 text-xs">Green-Link</span>
            </div>
          </div>
          <p className="text-xs text-center text-stone-600">
            © 2024 山东省绿色低碳产业协会 · 绿产智链平台 · 鲁ICP备XXXXXXXX号
          </p>
          <div className="flex gap-5 text-xs">
            <a href="#" className="hover:text-emerald-400 transition-colors duration-200">关于我们</a>
            <a href="#" className="hover:text-emerald-400 transition-colors duration-200">联系方式</a>
            <a href="#" className="hover:text-emerald-400 transition-colors duration-200">隐私政策</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
