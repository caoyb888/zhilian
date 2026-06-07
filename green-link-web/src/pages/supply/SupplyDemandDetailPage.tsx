import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import {
  ArrowLeft, Banknote, Building2, Calendar, Clock, Download,
  Eye, FileText, Heart, Lock, Mail, MapPin, Paperclip, Phone, User, X,
} from 'lucide-react'
import { Icon } from '@/components/Icon'
import { PortalNav } from '@/business/PortalNav'
import { Spinner } from '@/components/Spinner'
import { ErrorState } from '@/components/states/ErrorState'
import { useAuthStore } from '@/stores/authStore'
import {
  useDemandDetail,
  useFavoriteDemand,
  useUnfavoriteDemand,
  DEMAND_TYPE_LABELS,
  type AttachmentItem,
} from '@/services/supplyService'
import { useMemberDetail } from '@/services/memberService'

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
  if (!min && !max) return '面议'
  if (min && max) return `${min} – ${max} 万元`
  if (min) return `${min} 万元起`
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
      <div className="h-full bg-blue-500 transition-[width] duration-75 ease-linear" style={{ width: `${progress}%` }} />
    </div>
  )
}

// ─── Type badge ───────────────────────────────────────────────────────────────

const TYPE_BADGE_CLASS: Record<string, string> = {
  PRODUCT: 'bg-orange-50 text-orange-700 border-orange-200',
  TECHNOLOGY: 'bg-blue-50 text-blue-700 border-blue-200',
  TALENT: 'bg-purple-50 text-purple-700 border-purple-200',
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
        className="group relative block overflow-hidden rounded-xl border border-stone-200 bg-stone-50 hover:border-blue-400 transition-colors duration-200"
        title={att.fileName}
      >
        <img src={att.fileUrl} alt={att.fileName} className="h-36 w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3">
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
      className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 hover:border-blue-400 hover:bg-stone-100 transition-all duration-200 group"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-stone-200 text-stone-500 group-hover:text-blue-500 transition-colors">
        <Icon icon={FileText} size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-stone-800 truncate group-hover:text-blue-500 transition-colors">{att.fileName}</p>
        {att.fileSize && <p className="text-xs text-stone-400 mt-0.5">{formatFileSize(att.fileSize)}</p>}
      </div>
      <Icon icon={Download} size={16} className="flex-shrink-0 text-stone-400 group-hover:text-blue-400 transition-colors" />
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
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500">
          <Icon icon={Lock} size={18} />
        </div>
        <p className="text-sm text-stone-600">登录后可查看联系方式</p>
        <button
          type="button"
          onClick={onLoginRequest}
          className="w-full rounded-lg bg-theme-accent py-2 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200"
        >
          立即登录
        </button>
      </div>
    )
  }

  if (isLoading) {
    return <div className="flex justify-center py-6"><Spinner size="sm" className="text-stone-300" /></div>
  }

  return (
    <div className="space-y-3">
      {member?.contactName && (
        <div className="flex items-center gap-3 text-sm text-stone-700">
          <Icon icon={User} size={16} className="flex-shrink-0 text-stone-400" />
          <span>{member.contactName}</span>
        </div>
      )}
      {member?.contactPhone && (
        <div className="flex items-center gap-3 text-sm text-stone-700">
          <Icon icon={Phone} size={16} className="flex-shrink-0 text-stone-400" />
          <a href={`tel:${member.contactPhone}`} className="hover:text-theme-accent transition-colors">{member.contactPhone}</a>
        </div>
      )}
      {member?.contactEmail && (
        <div className="flex items-center gap-3 text-sm text-stone-700">
          <Icon icon={Mail} size={16} className="flex-shrink-0 text-stone-400" />
          <a href={`mailto:${member.contactEmail}`} className="truncate hover:text-theme-accent transition-colors">{member.contactEmail}</a>
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
      <div className="relative rounded-2xl bg-white p-8 shadow-xl max-w-sm w-full mx-4">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 transition-colors">
          <Icon icon={X} size={18} />
        </button>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500 mx-auto">
          <Icon icon={Lock} size={22} />
        </div>
        <h3 className="text-center text-base font-semibold text-stone-900 mb-2">请先登录</h3>
        <p className="text-center text-sm text-stone-500 mb-6">登录后即可查看联系方式及收藏需求</p>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-stone-200 py-2.5 text-sm text-stone-600 hover:bg-stone-50 transition-all duration-200">稍后再说</button>
          <button type="button" onClick={() => navigate('/login', { state: { from: location } })} className="flex-1 rounded-lg bg-theme-accent py-2.5 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200">去登录</button>
        </div>
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

  const [favorited, setFavorited] = useState(false)
  const [loginPrompt, setLoginPrompt] = useState(false)
  const [favoriteError, setFavoriteError] = useState<string | null>(null)

  const { data: demand, isLoading, isError } = useDemandDetail(demandId)

  useEffect(() => {
    if (demand?.isFavorited !== undefined) setFavorited(demand.isFavorited)
  }, [demand?.isFavorited])

  const { data: memberPublic } = useMemberDetail(demand?.memberId ?? null)

  const sanitizedContent = useMemo(
    () => DOMPurify.sanitize(demand?.content ?? ''),
    [demand?.content],
  )

  const favoriteMutation = useFavoriteDemand()
  const unfavoriteMutation = useUnfavoriteDemand()

  function handleFavorite() {
    if (!isLoggedIn) { setLoginPrompt(true); return }
    const showError = () => {
      setFavoriteError('收藏操作失败，请稍后重试')
      setTimeout(() => setFavoriteError(null), 3000)
    }
    if (favorited) {
      unfavoriteMutation.mutate(demand!.id, {
        onSuccess: () => setFavorited(false),
        onError: showError,
      })
    } else {
      favoriteMutation.mutate(demand!.id, {
        onSuccess: () => setFavorited(true),
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
                className="rounded-lg bg-theme-accent px-4 py-2 text-sm font-medium text-white hover:bg-theme-accent-hover transition-all duration-200"
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
    ? (TYPE_BADGE_CLASS[demand.type] ?? 'bg-gray-50 text-gray-600 border-gray-200')
    : ''

  const images = demand?.attachments.filter((a) => isImageType(a.fileType, a.fileName)) ?? []
  const files = demand?.attachments.filter((a) => !isImageType(a.fileType, a.fileName)) ?? []

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg">
      <ReadingProgressBar />
      <PortalNav />

      {isLoading || !demand ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="lg" className="text-theme-accent" />
        </div>
      ) : (
        <main className="flex-1">
          {/* Header */}
          <div className="bg-theme-surface border-b border-theme-border">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              <nav className="flex items-center gap-2 text-xs text-stone-400 mb-4">
                <Link to="/portal" className="hover:text-theme-accent transition-colors">首页</Link>
                <span>›</span>
                <Link to="/supply/demands" className="hover:text-theme-accent transition-colors">需求列表</Link>
                <span>›</span>
                <span className="text-stone-600 truncate max-w-[200px]">{demand.title}</span>
              </nav>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide border ${badgeClass}`}>
                  {typeLabel}
                </span>
                {demand.province && (
                  <span className="flex items-center gap-1 text-sm text-stone-500">
                    <Icon icon={MapPin} size={14} />
                    {demand.province}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-theme-text-main leading-snug">{demand.title}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-stone-500">
                {memberPublic?.name && (
                  <span className="flex items-center gap-1.5">
                    <Icon icon={Building2} size={14} className="text-stone-400" />
                    <span className="font-medium text-stone-700">{memberPublic.name}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Icon icon={Eye} size={14} />
                  <span>{demand.viewCount} 次浏览</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon icon={Calendar} size={14} />
                  <span>{formatDate(demand.createdAt)}</span>
                </span>
                {demand.deadline && (
                  <span className="flex items-center gap-1.5">
                    <Icon icon={Clock} size={14} />
                    <span>截止日期 {formatDate(demand.deadline)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Main content */}
              <div className="flex-1 min-w-0 space-y-8">
                {demand.summary && (
                  <div className="rounded-xl bg-blue-50 border-l-4 border-blue-400 px-5 py-4 text-sm text-stone-700 leading-relaxed">
                    {demand.summary}
                  </div>
                )}

                <div>
                  <h2 className="text-base font-semibold text-stone-800 mb-4">需求详情</h2>
                  {sanitizedContent ? (
                    <article className="article-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
                  ) : (
                    <p className="text-sm text-stone-400">暂无详细描述</p>
                  )}
                </div>

                {demand.tags.length > 0 && (
                  <div>
                    <h2 className="text-base font-semibold text-stone-800 mb-3">相关标签</h2>
                    <div className="flex flex-wrap gap-2">
                      {demand.tags.map((tag) => (
                        <span key={tag.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {demand.attachments.length > 0 && (
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold text-stone-800 mb-4">
                      <Icon icon={Paperclip} size={16} className="text-stone-500" />
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

                <div className="border-t border-theme-border pt-6 flex items-center justify-between">
                  <Link to="/supply/demands" className="inline-flex items-center gap-2 text-sm text-theme-accent hover:text-theme-accent-hover font-medium transition-colors">
                    <Icon icon={ArrowLeft} size={14} />
                    返回需求列表
                  </Link>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
                    回到顶部 ↑
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="lg:w-72 flex-shrink-0 space-y-4">
                {/* Contact card */}
                <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card">
                  <h3 className="text-sm font-semibold text-stone-800 mb-4">联系方式</h3>
                  {favoriteError && (
                    <div className="mb-3 flex items-center justify-between rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
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

                {/* Demand info card */}
                <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-card space-y-3">
                  <h3 className="text-sm font-semibold text-stone-800">需求信息</h3>
                  <div>
                    <p className="text-xs text-stone-400 mb-1">预算</p>
                    <p className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                      <Icon icon={Banknote} size={14} className="text-stone-400" />
                      {formatBudget(demand.budgetMin, demand.budgetMax)}
                    </p>
                  </div>
                  {demand.deadline && (
                    <div>
                      <p className="text-xs text-stone-400 mb-1">截止日期</p>
                      <p className="text-sm text-stone-700">{formatDate(demand.deadline)}</p>
                    </div>
                  )}
                  {demand.cooperationMode && (
                    <div>
                      <p className="text-xs text-stone-400 mb-1">合作方式</p>
                      <p className="text-sm text-stone-700">{demand.cooperationMode}</p>
                    </div>
                  )}
                  {memberPublic?.industry && (
                    <div>
                      <p className="text-xs text-stone-400 mb-1">所属行业</p>
                      <p className="text-sm text-stone-700">{memberPublic.industry}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-stone-400 mb-1">发布时间</p>
                    <p className="text-sm text-stone-700">{formatDate(demand.createdAt)}</p>
                  </div>
                </div>

                {/* Favorite */}
                <button
                  type="button"
                  onClick={handleFavorite}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all duration-200 ${
                    favorited
                      ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <Icon icon={Heart} size={16} className={favorited ? 'fill-rose-500 text-rose-500' : ''} />
                  {favorited ? '已收藏' : '收藏需求'}
                </button>
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
    </div>
  )
}
