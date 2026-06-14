import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import {
  ArrowLeft, Banknote, Building2, Calendar, Clock, Download,
  Eye, FileText, Handshake, Heart, Lock, Mail, MapPin, Paperclip, Phone, User, X,
  Share2, Link2, Check, Layers, Sparkles, Tag, BarChart3, BookOpen, Tags, Info,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { PortalNav } from '@/business/PortalNav'
import { Spinner } from '@/components/Spinner'
import { ErrorState } from '@/components/states/ErrorState'
import { ApplyMatchDialog } from '@/business/ApplyMatchDialog'
import { useAuthStore } from '@/stores/authStore'
import {
  useDemandDetail,
  useFavoriteDemand,
  useUnfavoriteDemand,
  DEMAND_TYPE_LABELS,
  type AttachmentItem,
} from '@/services/supplyService'
import { useMemberDetail } from '@/services/memberService'
import { useActiveMatchRecord, useRecommendations } from '@/services/matchService'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(s: string | null | undefined): string {
  if (!s) return ''
  return String(s).slice(0, 10)
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function isImageType(fileType: string | null, fileName: string): boolean {
  if (fileType?.startsWith('image/')) return true
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(fileName)
}

function formatBudget(min: number | null | undefined, max: number | null | undefined): string {
  const hasMin = min !== null && min !== undefined
  const hasMax = max !== null && max !== undefined
  if (!hasMin && !hasMax) return '面议'
  if (hasMin && hasMax) return `${min} – ${max} 万元`
  if (hasMin) return `${min} 万元起`
  return `≤ ${max} 万元`
}

// ─── Reading Progress ─────────────────────────────────────────────────────────

function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    function update() {
      const el = document.documentElement
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? Math.min(100, (el.scrollTop / total) * 100) : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 pointer-events-none">
      <div className="h-full bg-emerald-500 transition-[width] duration-75 ease-linear" style={{ width: `${progress}%` }} />
    </div>
  )
}

// ─── Type badge ───────────────────────────────────────────────────────────────

const TYPE_BADGE_CLASS: Record<string, string> = {
  PRODUCT: 'bg-orange-50 text-orange-700 ring-orange-200',
  TECHNOLOGY: 'bg-blue-50 text-blue-700 ring-blue-200',
  TALENT: 'bg-purple-50 text-purple-700 ring-purple-200',
}

// ─── Meta Tag Pill ────────────────────────────────────────────────────────────

function MetaTag({
  icon: IconComp,
  label,
  value,
  highlight = false,
}: {
  icon: typeof Eye
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors ${
        highlight
          ? 'bg-emerald-50/80 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-white/70 text-stone-600 ring-1 ring-stone-200/60'
      }`}
      title={`${label}: ${value}`}
    >
      <IconComp size={13} className={highlight ? 'text-emerald-500' : 'text-stone-400'} />
      <span>{value}</span>
    </div>
  )
}

// ─── Attachments ──────────────────────────────────────────────────────────────

function AttachmentPreview({ att }: { att: AttachmentItem }) {
  const isImage = isImageType(att.fileType, att.fileName)
  if (isImage) {
    return (
      <a
        href={att.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-2xl bg-stone-100 hover:shadow-card-hover transition-all duration-300"
        title={att.fileName}
      >
        <img
          src={att.fileUrl}
          alt={att.fileName}
          className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3">
          <span className="text-xs text-white font-medium truncate">{att.fileName}</span>
        </div>
      </a>
    )
  }
  return (
    <a
      href={att.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={att.fileName}
      className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 hover:shadow-card-hover transition-all duration-300 group"
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-500 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
        <Icon icon={FileText} size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-stone-800 truncate group-hover:text-emerald-700 transition-colors">{att.fileName}</p>
        {att.fileSize && <p className="text-xs text-stone-400 mt-0.5">{formatFileSize(att.fileSize)}</p>}
      </div>
      <Icon icon={Download} size={16} className="flex-shrink-0 text-stone-300 group-hover:text-emerald-500 transition-colors" />
    </a>
  )
}

// ─── Contact Card ─────────────────────────────────────────────────────────────

function ContactCard({
  memberId,
  isLoggedIn,
  onLoginRequest,
}: {
  memberId: number
  isLoggedIn: boolean
  onLoginRequest: () => void
}) {
  const { data: member, isLoading } = useMemberDetail(isLoggedIn ? memberId : null)

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
          <Icon icon={Lock} size={20} />
        </div>
        <p className="text-sm text-stone-600">登录后可查看联系方式</p>
        <button
          type="button"
          onClick={onLoginRequest}
          className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition-all duration-200"
        >
          立即登录
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="sm" className="text-stone-300" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {member?.contactName && (
        <div className="flex items-center gap-3 text-sm text-stone-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-50 text-stone-400">
            <Icon icon={User} size={14} />
          </div>
          <span>{member.contactName}</span>
        </div>
      )}
      {member?.contactPhone && (
        <div className="flex items-center gap-3 text-sm text-stone-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-50 text-stone-400">
            <Icon icon={Phone} size={14} />
          </div>
          <a href={`tel:${member.contactPhone}`} className="hover:text-emerald-600 transition-colors">{member.contactPhone}</a>
        </div>
      )}
      {member?.contactEmail && (
        <div className="flex items-center gap-3 text-sm text-stone-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-50 text-stone-400">
            <Icon icon={Mail} size={14} />
          </div>
          <a href={`mailto:${member.contactEmail}`} className="truncate hover:text-emerald-600 transition-colors">{member.contactEmail}</a>
        </div>
      )}
      {!member?.contactName && !member?.contactPhone && !member?.contactEmail && (
        <p className="text-sm text-stone-400 text-center py-2">暂无联系方式信息</p>
      )}
    </div>
  )
}

// ─── Login Prompt Modal ───────────────────────────────────────────────────────

function LoginPromptModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-3xl bg-white p-8 shadow-2xl max-w-sm w-full mx-4">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 transition-colors">
          <Icon icon={X} size={18} />
        </button>
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 mx-auto">
          <Icon icon={Lock} size={24} />
        </div>
        <h3 className="text-center text-lg font-semibold text-stone-900 mb-2">请先登录</h3>
        <p className="text-center text-sm text-stone-500 mb-6">登录后即可查看联系方式及收藏需求</p>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm text-stone-600 hover:bg-stone-50 transition-all duration-200">稍后再说</button>
          <button type="button" onClick={() => navigate('/login', { state: { from: location } })} className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition-all duration-200">去登录</button>
        </div>
      </div>
    </div>
  )
}

// ─── Share Panel ──────────────────────────────────────────────────────────────

function SharePanel({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const [posterOpen, setPosterOpen] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.href : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleNativeShare = async () => {
    if ('share' in navigator) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // fallback
      }
    }
    setPosterOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium transition-all duration-200 ${
            copied
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50'
          }`}
        >
          <Icon icon={copied ? Check : Link2} size={14} />
          {copied ? '已复制链接' : '复制链接'}
        </button>
        <button
          onClick={handleNativeShare}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white text-stone-600 ring-1 ring-stone-200 py-2.5 text-xs font-medium hover:bg-stone-50 transition-all duration-200"
        >
          <Icon icon={Share2} size={14} />
          海报分享
        </button>
      </div>

      {posterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPosterOpen(false)} />
          <div className="relative rounded-3xl bg-white p-6 shadow-2xl max-w-sm w-full mx-4">
            <button
              type="button"
              onClick={() => setPosterOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 transition-colors"
            >
              <Icon icon={X} size={16} />
            </button>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white text-center space-y-4">
              <div className="flex items-center justify-center gap-2 opacity-90">
                <Icon icon={Sparkles} size={18} />
                <span className="text-sm font-medium">绿产智链 · 优质需求</span>
              </div>
              <h4 className="text-lg font-bold leading-snug">{title}</h4>
              <div className="inline-block rounded-lg bg-white/20 px-3 py-1 text-xs backdrop-blur-sm">
                扫码或访问链接查看详情
              </div>
              <div className="rounded-xl bg-white p-3 mx-auto w-32 h-32 flex items-center justify-center">
                <div className="w-full h-full bg-stone-900 rounded-lg p-1">
                  <div className="w-full h-full bg-white rounded flex items-center justify-center">
                    <span className="text-[8px] text-stone-500 text-center leading-tight break-all px-1">
                      {url.replace(/^https?:\/\//, '').slice(0, 40)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs opacity-80">山东省绿色低碳产业发展协会</p>
            </div>
            <p className="text-center text-xs text-stone-400 mt-4">截图保存海报，分享给好友</p>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Similar Demands ──────────────────────────────────────────────────────────

function SimilarDemands({ demandId }: { demandId: number }) {
  const navigate = useNavigate()
  const { data, isLoading } = useRecommendations(
    { sourceType: 'DEMAND', sourceId: demandId, page: 1, size: 4 },
    true,
  )

  const items = useMemo(
    () => data?.records.filter((r) => r.targetType === 'DEMAND' && r.targetId !== demandId).slice(0, 4) ?? [],
    [data, demandId],
  )

  if (isLoading) {
    return (
      <div className="mt-14">
        <div className="flex items-center gap-2 mb-5">
          <Icon icon={Layers} size={20} className="text-emerald-500" />
          <h2 className="text-lg font-bold text-stone-800">相似需求推荐</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-3xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <div className="mt-14">
      <div className="flex items-center gap-2 mb-5">
        <Icon icon={Layers} size={20} className="text-emerald-500" />
        <h2 className="text-lg font-bold text-stone-800">相似需求推荐</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.targetId}
            onClick={() => navigate(`/supply/demands/${item.targetId}`)}
            className="group cursor-pointer rounded-3xl bg-white p-5 ring-1 ring-stone-100 hover:ring-emerald-200 hover:shadow-nordic transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <Icon icon={BarChart3} size={12} />
                匹配度 {item.matchScore}%
              </span>
            </div>
            <h3 className="text-sm font-semibold text-stone-800 line-clamp-2 group-hover:text-emerald-700 transition-colors leading-relaxed">
              {item.targetTitle}
            </h3>
            {item.targetMember && (
              <p className="text-xs text-stone-400 mt-3 flex items-center gap-1.5">
                <Icon icon={Building2} size={12} />
                {item.targetMember.name}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupplyDemandDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const demandId = id && /^\d+$/.test(id) ? Number(id) : null
  const isInvalidId = id !== undefined && demandId === null

  const accountInfo = useAuthStore((s) => s.accountInfo)
  const isLoggedIn = !!accountInfo

  const [favOverride, setFavOverride] = useState<boolean | null>(null)
  const [loginPrompt, setLoginPrompt] = useState(false)
  const [favoriteError, setFavoriteError] = useState<string | null>(null)
  const [applyOpen, setApplyOpen] = useState(false)

  const { data: demand, isLoading, isError } = useDemandDetail(demandId)

  const activeMatchRecord = useActiveMatchRecord(
    'demandId',
    demand?.id,
    isLoggedIn && !!demand && accountInfo?.memberId !== demand.memberId,
  )

  const favorited = favOverride ?? (demand?.isFavorited ?? false)

  const { data: memberPublic } = useMemberDetail(demand?.memberId ?? null)

  const sanitizedContent = useMemo(
    () => DOMPurify.sanitize(demand?.content ?? ''),
    [demand?.content],
  )

  const favoriteMutation = useFavoriteDemand()
  const unfavoriteMutation = useUnfavoriteDemand()

  function handleFavorite() {
    if (favoriteMutation.isPending || unfavoriteMutation.isPending) return
    if (!isLoggedIn) { setLoginPrompt(true); return }
    const showError = () => {
      setFavoriteError('收藏操作失败，请稍后重试')
      setTimeout(() => setFavoriteError(null), 3000)
    }
    if (favorited) {
      unfavoriteMutation.mutate(demand!.id, {
        onSuccess: () => setFavOverride(false),
        onError: showError,
      })
    } else {
      favoriteMutation.mutate(demand!.id, {
        onSuccess: () => setFavOverride(true),
        onError: showError,
      })
    }
  }

  if (isError || isInvalidId) {
    return (
      <div className="min-h-screen flex flex-col bg-theme-bg">
        <PortalNav />
        <div className="flex flex-1 items-center justify-center">
          <ErrorState
            title="需求不存在或已关闭"
            description="您访问的需求可能已被删除或暂时无法查看"
            action={
              <button
                onClick={() => navigate('/supply/demands')}
                className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition-all duration-200"
              >
                返回需求列表
              </button>
            }
          />
        </div>
      </div>
    )
  }

  const typeLabel = demand ? (DEMAND_TYPE_LABELS[demand.type] ?? demand.type) : ''
  const badgeClass = demand
    ? (TYPE_BADGE_CLASS[demand.type] ?? 'bg-gray-50 text-gray-600 ring-gray-200')
    : ''

  const images = demand?.attachments.filter((a) => isImageType(a.fileType, a.fileName)) ?? []
  const files = demand?.attachments.filter((a) => !isImageType(a.fileType, a.fileName)) ?? []

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg">
      <ReadingProgressBar />
      <PortalNav />

      {isLoading || !demand ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="lg" className="text-emerald-500" />
        </div>
      ) : (
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Main content */}
              <div className="flex-1 min-w-0 space-y-8">
                {/* Header */}
                <div className="pt-2 pb-4">
                  <nav className="flex items-center gap-2 text-xs text-stone-400 mb-5">
                    <Link to="/portal" className="hover:text-emerald-600 transition-colors">首页</Link>
                    <span className="text-stone-300">›</span>
                    <Link to="/supply/demands" className="hover:text-emerald-600 transition-colors">需求列表</Link>
                    <span className="text-stone-300">›</span>
                    <span className="text-stone-600 truncate max-w-[220px]">{demand.title}</span>
                  </nav>

                  <div className="mb-4">
                    <span className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide ring-1 ${badgeClass}`}>
                      {typeLabel}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 leading-tight tracking-tight">
                    {demand.title}
                  </h1>

                  <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    {memberPublic?.name && (
                      <MetaTag icon={Building2} label="发布方" value={memberPublic.name} highlight />
                    )}
                    <MetaTag icon={Eye} label="浏览量" value={`${demand.viewCount} 次浏览`} />
                    <MetaTag icon={Calendar} label="发布时间" value={formatDate(demand.createdAt)} />
                    {demand.deadline && (
                      <MetaTag icon={Clock} label="截止日期" value={`至 ${formatDate(demand.deadline)}`} />
                    )}
                    {demand.province && (
                      <MetaTag icon={MapPin} label="地区" value={demand.province} />
                    )}
                    {memberPublic?.industry && (
                      <MetaTag icon={Tag} label="行业" value={memberPublic.industry} />
                    )}
                  </div>
                </div>

                {/* Highlights */}
                {demand.summary && (
                  <div className="rounded-3xl bg-emerald-50/60 ring-1 ring-emerald-100 px-6 py-6">
                    <div className="flex items-center gap-2.5 mb-4">
                      <Icon icon={Sparkles} size={20} className="text-emerald-500" />
                      <span className="text-base font-bold text-emerald-800">需求亮点</span>
                    </div>
                    <ul className="space-y-2.5">
                      {demand.summary
                        .split(/[\n,，;；]/)
                        .map((s) => s.trim())
                        .filter((s) => s.length > 0)
                        .map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-stone-700 leading-relaxed">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Rich text content */}
                <div className="rounded-3xl bg-white ring-1 ring-stone-100 p-6 sm:p-8">
                  <h2 className="text-base font-bold text-stone-800 mb-5 flex items-center gap-2.5">
                    <Icon icon={BookOpen} size={18} className="text-emerald-500" />
                    需求详情
                  </h2>
                  {sanitizedContent ? (
                    <article className="article-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
                  ) : (
                    <p className="text-sm text-stone-400">暂无详细描述</p>
                  )}
                </div>

                {/* Tags */}
                {demand.tags.length > 0 && (
                  <div>
                    <h2 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2.5">
                      <Icon icon={Tags} size={18} className="text-emerald-500" />
                      相关标签
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {demand.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-50/80 ring-1 ring-emerald-200 px-3.5 py-1.5 text-xs font-medium text-emerald-700"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {demand.attachments.length > 0 && (
                  <div>
                    <h2 className="flex items-center gap-2.5 text-base font-bold text-stone-800 mb-5">
                      <Icon icon={Paperclip} size={18} className="text-emerald-500" />
                      附件（{demand.attachments.length}）
                    </h2>
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {images.map((att) => <AttachmentPreview key={att.id} att={att} />)}
                      </div>
                    )}
                    {files.length > 0 && (
                      <div className="space-y-2">
                        {files.map((att) => <AttachmentPreview key={att.id} att={att} />)}
                      </div>
                    )}
                  </div>
                )}

                {/* Similar demands */}
                <SimilarDemands demandId={demand.id} />

                {/* Back link */}
                <div className="flex items-center justify-between pt-4">
                  <Link to="/supply/demands" className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                    <Icon icon={ArrowLeft} size={14} />
                    返回需求列表
                  </Link>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
                    回到顶部 ↑
                  </button>
                </div>
              </div>

              {/* Sidebar — sticky */}
              <aside className="lg:w-80 flex-shrink-0">
                <div className="lg:sticky lg:top-24 space-y-4">
                  {/* CTA — 发起对接申请（核心操作置顶） */}
                  {isLoggedIn && accountInfo?.memberId !== demand.memberId && (
                    <div className="rounded-3xl bg-white ring-1 ring-stone-100 p-5 shadow-card">
                      <button
                        type="button"
                        disabled={!!activeMatchRecord}
                        onClick={() => !activeMatchRecord && setApplyOpen(true)}
                        className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-all duration-200 ${
                          activeMatchRecord
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                        }`}
                      >
                        <Icon icon={Handshake} size={18} />
                        {activeMatchRecord ? '已申请对接' : '发起对接申请'}
                      </button>
                      {!activeMatchRecord && (
                        <p className="text-xs text-stone-400 text-center mt-2.5">
                          点击即可向发布方发送合作意向
                        </p>
                      )}
                    </div>
                  )}

                  {/* Demand info card */}
                  <div className="rounded-3xl bg-white ring-1 ring-stone-100 p-5 space-y-4">
                    <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2.5">
                      <Icon icon={Info} size={16} className="text-emerald-500" />
                      需求信息
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-400">
                          <Icon icon={Banknote} size={14} />
                        </div>
                        <div>
                          <p className="text-xs text-stone-400">预算</p>
                          <p className="text-sm font-medium text-stone-700 mt-0.5">
                            {formatBudget(demand.budgetMin, demand.budgetMax)}
                          </p>
                        </div>
                      </div>
                      {demand.deadline && (
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-400">
                            <Icon icon={Clock} size={14} />
                          </div>
                          <div>
                            <p className="text-xs text-stone-400">截止日期</p>
                            <p className="text-sm font-medium text-stone-700 mt-0.5">{formatDate(demand.deadline)}</p>
                          </div>
                        </div>
                      )}
                      {demand.cooperationMode && (
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-400">
                            <Icon icon={Handshake} size={14} />
                          </div>
                          <div>
                            <p className="text-xs text-stone-400">合作方式</p>
                            <p className="text-sm font-medium text-stone-700 mt-0.5">{demand.cooperationMode}</p>
                          </div>
                        </div>
                      )}
                      {memberPublic?.industry && (
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-400">
                            <Icon icon={Tag} size={14} />
                          </div>
                          <div>
                            <p className="text-xs text-stone-400">所属行业</p>
                            <p className="text-sm font-medium text-stone-700 mt-0.5">{memberPublic.industry}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-400">
                          <Icon icon={Calendar} size={14} />
                        </div>
                        <div>
                          <p className="text-xs text-stone-400">发布时间</p>
                          <p className="text-sm font-medium text-stone-700 mt-0.5">{formatDate(demand.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact card */}
                  <div className="rounded-3xl bg-white ring-1 ring-stone-100 p-5 shadow-card">
                    <h3 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2.5">
                      <Icon icon={Phone} size={16} className="text-emerald-500" />
                      联系方式
                    </h3>
                    {favoriteError && (
                      <div className="mb-3 flex items-center justify-between rounded-xl bg-red-50 ring-1 ring-red-100 px-3 py-2 text-xs text-red-600">
                        {favoriteError}
                        <button type="button" onClick={() => setFavoriteError(null)}>
                          <Icon icon={X} size={12} />
                        </button>
                      </div>
                    )}
                    <ContactCard
                      memberId={demand.memberId}
                      isLoggedIn={isLoggedIn}
                      onLoginRequest={() => setLoginPrompt(true)}
                    />
                  </div>

                  {/* Favorite */}
                  <button
                    type="button"
                    onClick={handleFavorite}
                    className={`w-full flex items-center justify-center gap-2 rounded-3xl py-3.5 text-sm font-medium transition-all duration-200 ${
                      favorited
                        ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100'
                        : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <Icon icon={Heart} size={16} className={favorited ? 'fill-rose-500 text-rose-500' : ''} />
                    {favorited ? '已收藏' : '收藏需求'}
                  </button>

                  {/* Share */}
                  <div className="rounded-3xl bg-white ring-1 ring-stone-100 p-5">
                    <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2.5">
                      <Icon icon={Share2} size={16} className="text-emerald-500" />
                      分享需求
                    </h3>
                    <SharePanel title={demand.title} />
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      )}

      <footer className="bg-stone-900 text-stone-400 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs">
          © 2024 山东省绿色低碳产业协会 · 绿产智链平台
        </div>
      </footer>

      {loginPrompt && <LoginPromptModal onClose={() => setLoginPrompt(false)} />}

      {applyOpen && demand && (
        <ApplyMatchDialog
          target={{ type: 'DEMAND', id: demand.id, title: demand.title }}
          onClose={() => setApplyOpen(false)}
        />
      )}
    </div>
  )
}
