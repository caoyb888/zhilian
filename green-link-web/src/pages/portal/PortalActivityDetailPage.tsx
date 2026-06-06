import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { PortalNav } from '@/business/PortalNav'
import { Spinner } from '@/components/Spinner'
import {
  usePublicActivityDetail,
  useMySignupStatus,
  useSignupActivity,
  useCancelSignup,
  ACTIVITY_STATUS_MAP,
} from '@/services/activityService'
import { useAuthStore } from '@/stores/authStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(s: string | null) {
  return s ? s.slice(0, 16).replace('T', ' ') : '—'
}

// ─── Capacity Bar ─────────────────────────────────────────────────────────────

function CapacityBar({
  regCount,
  maxCapacity,
}: {
  regCount: number
  maxCapacity: number | null
}) {
  if (!maxCapacity) return null
  const pct = Math.min(100, Math.round((regCount / maxCapacity) * 100))
  const isFull = regCount >= maxCapacity

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>报名人数</span>
        <span className={isFull ? 'text-red-500 font-medium' : ''}>
          {regCount} / {maxCapacity}
          {isFull && ' · 已满'}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isFull ? 'bg-red-400' : 'bg-brand-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Signup Panel ─────────────────────────────────────────────────────────────

function SignupPanel({ activityId }: { activityId: number }) {
  const navigate = useNavigate()
  const accountInfo = useAuthStore((s) => s.accountInfo)

  const { data: activity } = usePublicActivityDetail(activityId)
  const { data: signupStatus, isLoading: statusLoading } = useMySignupStatus(activityId)
  const signupMut = useSignupActivity()
  const cancelMut = useCancelSignup()

  const [remark, setRemark] = useState('')
  const [showRemarkInput, setShowRemarkInput] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  if (!activity) return null

  const isFull =
    activity.maxCapacity !== null && activity.regCount >= activity.maxCapacity
  const isRegistering = activity.status === 2
  const alreadySigned = signupStatus?.signed && signupStatus.signupStatus !== 3
  const checkedIn = signupStatus?.signupStatus === 2

  async function handleSignup() {
    if (!accountInfo) {
      navigate(`/login?returnUrl=/portal/activities/${activityId}`)
      return
    }
    try {
      await signupMut.mutateAsync({ activityId, remark: remark || undefined })
      setShowRemarkInput(false)
      setRemark('')
      setFeedback('报名成功！')
      setTimeout(() => setFeedback(null), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg
      setFeedback(msg ?? '报名失败，请稍后重试')
      setTimeout(() => setFeedback(null), 4000)
    }
  }

  async function handleCancel() {
    if (!confirm('确认取消报名？')) return
    try {
      await cancelMut.mutateAsync(activityId)
      setFeedback('已取消报名')
      setTimeout(() => setFeedback(null), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg
      setFeedback(msg ?? '操作失败，请稍后重试')
      setTimeout(() => setFeedback(null), 4000)
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
      <h3 className="font-semibold text-gray-900 text-sm">活动报名</h3>

      <CapacityBar regCount={activity.regCount} maxCapacity={activity.maxCapacity} />

      {/* Feedback message */}
      {feedback && (
        <div
          className={`rounded-lg px-3 py-2 text-sm text-center font-medium ${
            feedback.startsWith('报名成功') || feedback.startsWith('已取消')
              ? 'bg-brand-50 text-brand-700'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {feedback}
        </div>
      )}

      {statusLoading ? (
        <div className="flex justify-center py-2">
          <Spinner size="sm" className="text-brand-400" />
        </div>
      ) : checkedIn ? (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">
          您已签到参加本活动 ✓
        </div>
      ) : alreadySigned ? (
        <div className="space-y-2">
          <div className="rounded-lg bg-brand-50 px-4 py-3 text-center text-sm text-brand-700 font-medium">
            您已成功报名 ✓
          </div>
          <button
            onClick={handleCancel}
            disabled={cancelMut.isPending}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
          >
            {cancelMut.isPending ? '取消中…' : '取消报名'}
          </button>
        </div>
      ) : !isRegistering ? (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-center text-sm text-gray-400">
          {activity.status === 1 ? '活动筹备中，尚未开放报名' : '报名已截止'}
        </div>
      ) : isFull ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-500 font-medium">
          名额已满，暂不接受报名
        </div>
      ) : !accountInfo ? (
        <button
          onClick={() => navigate(`/login?returnUrl=/portal/activities/${activityId}`)}
          className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          登录后报名
        </button>
      ) : (
        <div className="space-y-2">
          {showRemarkInput ? (
            <>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="备注信息（选填，500字以内）"
                maxLength={500}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSignup}
                  disabled={signupMut.isPending}
                  className="flex-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {signupMut.isPending ? '提交中…' : '确认报名'}
                </button>
                <button
                  onClick={() => { setShowRemarkInput(false); setRemark('') }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSignup}
                disabled={signupMut.isPending}
                className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {signupMut.isPending ? '报名中…' : '立即报名'}
              </button>
              <button
                onClick={() => setShowRemarkInput(true)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                title="添加备注"
              >
                备注
              </button>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        报名成功后可在"会员中心"查看记录
      </p>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PortalActivityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const activityId = id ? Number(id) : null
  const navigate = useNavigate()

  const { data: activity, isLoading, isError } = usePublicActivityDetail(activityId)

  const sanitizedContent = useMemo(
    () => DOMPurify.sanitize(activity?.content ?? ''),
    [activity?.content],
  )

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col">
        <PortalNav />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-gray-500">
          <p className="text-lg">活动不存在或已下线</p>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-brand-600 underline hover:text-brand-700"
          >
            返回上一页
          </button>
        </div>
      </div>
    )
  }

  const statusMeta = activity
    ? (ACTIVITY_STATUS_MAP[activity.status] ?? { label: '未知', color: 'bg-gray-100 text-gray-500' })
    : null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PortalNav />

      {isLoading || !activity ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="lg" className="text-brand-500" />
        </div>
      ) : (
        <main className="flex-1">
          {/* Hero */}
          <div className="bg-white border-b border-gray-100">
            {activity.coverUrl && (
              <div className="h-56 sm:h-72 overflow-hidden">
                <img
                  src={activity.coverUrl}
                  alt={activity.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                <Link to="/portal" className="hover:text-brand-600 transition-colors">
                  首页
                </Link>
                <span>›</span>
                <Link to="/portal/activities" className="hover:text-brand-600 transition-colors">
                  近期活动
                </Link>
                <span>›</span>
                <span className="text-gray-600 line-clamp-1">{activity.title}</span>
              </nav>

              {/* Status badge */}
              {statusMeta && (
                <span
                  className={`inline-block rounded-md text-xs font-medium px-2.5 py-1 mb-3 ${statusMeta.color}`}
                >
                  {statusMeta.label}
                </span>
              )}

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
                {activity.title}
              </h1>
            </div>
          </div>

          {/* Two-column body */}
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left: content */}
              <div className="flex-1 min-w-0">
                {/* Meta info card */}
                <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5 mb-6">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">活动信息</h3>
                  <dl className="space-y-3 text-sm">
                    {activity.location && (
                      <div className="flex gap-3">
                        <dt className="flex-shrink-0 text-gray-400 w-16">活动地点</dt>
                        <dd className="text-gray-700">{activity.location}</dd>
                      </div>
                    )}
                    {activity.startTime && (
                      <div className="flex gap-3">
                        <dt className="flex-shrink-0 text-gray-400 w-16">开始时间</dt>
                        <dd className="text-gray-700">{formatDateTime(activity.startTime)}</dd>
                      </div>
                    )}
                    {activity.endTime && (
                      <div className="flex gap-3">
                        <dt className="flex-shrink-0 text-gray-400 w-16">结束时间</dt>
                        <dd className="text-gray-700">{formatDateTime(activity.endTime)}</dd>
                      </div>
                    )}
                    {activity.regDeadline && (
                      <div className="flex gap-3">
                        <dt className="flex-shrink-0 text-gray-400 w-16">报名截止</dt>
                        <dd
                          className={`font-medium ${
                            activity.status === 2 ? 'text-amber-600' : 'text-gray-700'
                          }`}
                        >
                          {formatDateTime(activity.regDeadline)}
                        </dd>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <dt className="flex-shrink-0 text-gray-400 w-16">报名人数</dt>
                      <dd className="text-gray-700">
                        {activity.regCount}
                        {activity.maxCapacity ? ` / ${activity.maxCapacity}` : ' 人'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Activity content */}
                {sanitizedContent ? (
                  <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 text-sm mb-4">活动详情</h3>
                    <article
                      className="article-content"
                      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-6 text-sm text-gray-400">
                    暂无活动详情
                  </div>
                )}

                {/* Back link */}
                <div className="mt-6">
                  <Link
                    to="/portal/activities"
                    className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 transition-colors font-medium"
                  >
                    ← 返回活动列表
                  </Link>
                </div>
              </div>

              {/* Right: signup panel (sticky on desktop) */}
              <div className="lg:w-72 flex-shrink-0">
                <div className="lg:sticky lg:top-20">
                  {activityId && <SignupPanel activityId={activityId} />}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      <footer className="bg-gray-900 text-gray-400 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs">
          © 2024 山东省绿色低碳产业协会 · 绿产智链平台
        </div>
      </footer>
    </div>
  )
}
