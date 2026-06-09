import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Handshake,
  Paperclip,
  RefreshCw,
  Send,
  XCircle,
} from 'lucide-react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { clsx } from 'clsx'
import { Icon } from '@/components/Icon'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Spinner } from '@/components/Spinner'
import { useAuthStore } from '@/stores/authStore'
import { uploadFileWithProgress } from '@/services/fileService'
import {
  fetchMatchMessages,
  useSendMatchMessage,
  useMarkMatchMessagesRead,
  useMyMatchRecords,
  useRespondMatch,
  useUpdateMatchStatus,
  type MatchMessage,
  type MatchRecordItem,
} from '@/services/matchService'
import type { BadgeVariant } from '@/components/Badge'
import type { PageData } from '@/types/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 30
const POLL_INTERVAL = 10_000

// ─── Status metadata ──────────────────────────────────────────────────────────

const STATUS_META: Record<number, { label: string; variant: BadgeVariant }> = {
  1: { label: '待响应', variant: 'warning' },
  2: { label: '已接受', variant: 'news' },
  3: { label: '洽谈中', variant: 'success' },
  5: { label: '已完成', variant: 'success' },
  6: { label: '已拒绝', variant: 'error' },
  7: { label: '已撤销', variant: 'default' },
}

/** Status values that allow sending messages */
const CAN_CHAT_STATUSES = new Set([1, 2, 3])

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMsgTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const timeStr = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return timeStr
  return (
    d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) + ' ' + timeStr
  )
}

// ─── Pending message (optimistic UI) ─────────────────────────────────────────

interface PendingMsg {
  tempId: string
  content: string
  msgType: number
  attachUrl?: string
  status: 'sending' | 'failed'
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, isMine }: { msg: MatchMessage; isMine: boolean }) {
  return (
    <div className={clsx('flex gap-2 items-end mb-3', isMine ? 'flex-row-reverse' : 'flex-row')}>
      <div className={clsx(
        'h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold select-none',
        isMine ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600',
      )}>
        {isMine ? '我' : '他'}
      </div>

      <div className={clsx('max-w-[72%] flex flex-col gap-1', isMine ? 'items-end' : 'items-start')}>
        {msg.msgType === 2 && msg.attachUrl ? (
          <a
            href={msg.attachUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              'rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2 transition-colors',
              isMine
                ? 'bg-emerald-500 text-white rounded-br-sm hover:bg-emerald-600'
                : 'bg-white border border-stone-200 text-stone-800 rounded-bl-sm hover:bg-stone-50',
            )}
          >
            <Icon icon={Paperclip} size={13} />
            <span>查看附件</span>
          </a>
        ) : (
          <div className={clsx(
            'rounded-2xl px-4 py-2.5 text-sm break-words whitespace-pre-wrap leading-relaxed',
            isMine
              ? 'bg-emerald-500 text-white rounded-br-sm'
              : 'bg-white border border-stone-200 text-stone-800 rounded-bl-sm',
          )}>
            {msg.content}
          </div>
        )}

        <div className={clsx(
          'flex items-center gap-1.5 text-[11px] text-stone-400',
          isMine ? 'flex-row-reverse' : '',
        )}>
          <span>{formatMsgTime(msg.createdAt)}</span>
          {isMine && (
            <span className={msg.isRead ? 'text-emerald-500' : 'text-stone-300'}>
              {msg.isRead ? '已读' : '未读'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Pending bubble ───────────────────────────────────────────────────────────

function PendingBubble({ msg, onRetry }: { msg: PendingMsg; onRetry: () => void }) {
  return (
    <div className="flex gap-2 items-end mb-3 flex-row-reverse">
      <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold bg-emerald-100 text-emerald-700 select-none">
        我
      </div>
      <div className="max-w-[72%] flex flex-col gap-1 items-end">
        <div className={clsx(
          'rounded-2xl px-4 py-2.5 text-sm break-words whitespace-pre-wrap leading-relaxed rounded-br-sm',
          msg.status === 'failed'
            ? 'bg-red-100 text-red-700 border border-red-200'
            : 'bg-emerald-400 text-white opacity-70',
        )}>
          {msg.content}
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          {msg.status === 'sending' && (
            <>
              <Spinner size="sm" className="text-stone-400 h-3 w-3" />
              <span className="text-stone-400">发送中…</span>
            </>
          )}
          {msg.status === 'failed' && (
            <>
              <Icon icon={AlertCircle} size={11} className="text-red-400" />
              <span className="text-red-400">发送失败</span>
              <button
                type="button"
                onClick={onRetry}
                className="text-emerald-600 hover:underline"
              >
                重试
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  description,
  confirmLabel,
  danger,
  isPending,
  onConfirm,
  onClose,
}: {
  title: string
  description: string
  confirmLabel: string
  danger?: boolean
  isPending: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 shadow-xl">
          <div className="flex items-start gap-3 mb-4">
            <div className={clsx(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              danger ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500',
            )}>
              <Icon icon={AlertTriangle} size={20} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-stone-800">{title}</DialogTitle>
              <p className="mt-1 text-sm text-stone-500">{description}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isPending}>
              取消
            </Button>
            <Button
              variant={danger ? 'danger' : 'primary'}
              size="sm"
              type="button"
              loading={isPending}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ─── Status action bar ────────────────────────────────────────────────────────

function StatusActionBar({
  record,
  onStatusChange,
}: {
  record: MatchRecordItem
  onStatusChange: (s: number) => void
}) {
  const [confirm, setConfirm] = useState<'reject' | 'cancel' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const respondMutation = useRespondMatch()
  const statusMutation = useUpdateMatchStatus()
  const isPending = respondMutation.isPending || statusMutation.isPending

  function doAction(fn: () => void) {
    setActionError(null)
    fn()
  }

  function handleAccept() {
    doAction(() =>
      respondMutation.mutate(
        { recordId: record.recordId, action: 'ACCEPT' },
        {
          onSuccess: (data) => { setConfirm(null); onStatusChange(data?.status ?? 2) },
          onError: () => setActionError('操作失败，请稍后重试'),
        },
      ),
    )
  }

  function handleReject() {
    doAction(() =>
      respondMutation.mutate(
        { recordId: record.recordId, action: 'REJECT' },
        {
          onSuccess: (data) => { setConfirm(null); onStatusChange(data?.status ?? 6) },
          onError: () => setActionError('操作失败，请稍后重试'),
        },
      ),
    )
  }

  function handleStatusAction(action: 'NEGOTIATE' | 'COMPLETE' | 'CANCEL') {
    doAction(() =>
      statusMutation.mutate(
        { recordId: record.recordId, action },
        {
          onSuccess: (data) => {
            setConfirm(null)
            onStatusChange(data?.status ?? record.status)
          },
          onError: () => setActionError('操作失败，请稍后重试'),
        },
      ),
    )
  }

  const { status, isInitiator } = record

  if (status === 5 || status === 6 || status === 7) return null

  return (
    <div className="px-4 py-2 border-b border-stone-100 bg-stone-50">
      {actionError && (
        <p className="text-xs text-red-500 mb-2">{actionError}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {status === 1 && !isInitiator && (
          <>
            <Button
              variant="primary"
              size="sm"
              loading={respondMutation.isPending && respondMutation.variables?.action === 'ACCEPT'}
              disabled={isPending}
              onClick={handleAccept}
            >
              <Icon icon={CheckCircle2} size={13} className="mr-1" />
              接受申请
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isPending}
              onClick={() => setConfirm('reject')}
            >
              <Icon icon={XCircle} size={13} className="mr-1" />
              拒绝申请
            </Button>
          </>
        )}
        {status === 1 && isInitiator && (
          <Button variant="secondary" size="sm" disabled={isPending} onClick={() => setConfirm('cancel')}>
            撤回申请
          </Button>
        )}
        {status === 2 && (
          <>
            <Button
              variant="primary"
              size="sm"
              loading={statusMutation.isPending && statusMutation.variables?.action === 'NEGOTIATE'}
              disabled={isPending}
              onClick={() => handleStatusAction('NEGOTIATE')}
            >
              进入洽谈
            </Button>
            <Button variant="secondary" size="sm" disabled={isPending} onClick={() => setConfirm('cancel')}>
              撤销对接
            </Button>
          </>
        )}
        {status === 3 && (
          <>
            <Button
              variant="primary"
              size="sm"
              loading={statusMutation.isPending && statusMutation.variables?.action === 'COMPLETE'}
              disabled={isPending}
              onClick={() => handleStatusAction('COMPLETE')}
            >
              <Icon icon={CheckCircle2} size={13} className="mr-1" />
              标记完成
            </Button>
            <Button variant="secondary" size="sm" disabled={isPending} onClick={() => setConfirm('cancel')}>
              撤销对接
            </Button>
          </>
        )}
      </div>

      {confirm === 'reject' && (
        <ConfirmModal
          title="确认拒绝申请？"
          description="拒绝后对方将收到通知，此操作不可撤销。"
          confirmLabel="确认拒绝"
          danger
          isPending={respondMutation.isPending}
          onConfirm={handleReject}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === 'cancel' && (
        <ConfirmModal
          title={status === 1 ? '确认撤回申请？' : '确认撤销对接？'}
          description={status === 1 ? '撤回后对方将不再收到该申请。' : '撤销后对接流程将终止，请谨慎操作。'}
          confirmLabel={status === 1 ? '确认撤回' : '确认撤销'}
          danger
          isPending={statusMutation.isPending}
          onConfirm={() => handleStatusAction('CANCEL')}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

// ─── useChatMessages hook ─────────────────────────────────────────────────────

interface ChatMessagesState {
  messages: MatchMessage[]
  isInitializing: boolean
  isLoadingOlder: boolean
  hasOlderMessages: boolean
  initError: string | null
}

function useChatMessages(matchId: number | null) {
  const [state, setState] = useState<ChatMessagesState>({
    messages: [],
    isInitializing: true,
    isLoadingOlder: false,
    hasOlderMessages: false,
    initError: null,
  })

  // Track which page range we've loaded: [oldestPage .. latestPage]
  const oldestPageRef = useRef<number>(1)
  const latestPageRef = useRef<number>(1)
  const knownTotalRef = useRef<number>(0)

  // Append new messages (dedup by id)
  const mergeMessages = useCallback(
    (existing: MatchMessage[], incoming: MatchMessage[]): MatchMessage[] => {
      const ids = new Set(existing.map((m) => m.id))
      const fresh = incoming.filter((m) => !ids.has(m.id))
      if (fresh.length === 0) return existing
      return [...existing, ...fresh].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    },
    [],
  )

  // Prepend older messages
  const prependMessages = useCallback(
    (existing: MatchMessage[], incoming: MatchMessage[]): MatchMessage[] => {
      const ids = new Set(existing.map((m) => m.id))
      const fresh = incoming.filter((m) => !ids.has(m.id))
      if (fresh.length === 0) return existing
      return [...fresh, ...existing].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    },
    [],
  )

  // Initial load: fetch latest page
  useEffect(() => {
    if (matchId === null) return

    let cancelled = false

    async function init() {
      setState((s) => ({ ...s, isInitializing: true, initError: null }))
      try {
        // First request to get total
        const first = await fetchMatchMessages(matchId!, { page: 1, size: PAGE_SIZE })
        if (cancelled) return

        const total = first.total
        knownTotalRef.current = total
        const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))

        let initialMsgs: MatchMessage[]
        if (lastPage === 1) {
          initialMsgs = first.records
          oldestPageRef.current = 1
          latestPageRef.current = 1
          setState({
            messages: initialMsgs,
            isInitializing: false,
            isLoadingOlder: false,
            hasOlderMessages: false,
            initError: null,
          })
        } else {
          // Fetch last page for newest messages
          const last = await fetchMatchMessages(matchId!, { page: lastPage, size: PAGE_SIZE })
          if (cancelled) return
          initialMsgs = last.records
          oldestPageRef.current = lastPage
          latestPageRef.current = lastPage
          setState({
            messages: initialMsgs,
            isInitializing: false,
            isLoadingOlder: false,
            hasOlderMessages: lastPage > 1,
            initError: null,
          })
        }
      } catch {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            isInitializing: false,
            initError: '加载消息失败，请刷新重试',
          }))
        }
      }
    }

    init()
    return () => { cancelled = true }
  }, [matchId])

  // Load older messages (called by IntersectionObserver)
  const loadOlderMessages = useCallback(async () => {
    if (
      matchId === null ||
      state.isLoadingOlder ||
      state.isInitializing ||
      oldestPageRef.current <= 1
    ) return

    setState((s) => ({ ...s, isLoadingOlder: true }))
    try {
      const prevPage = oldestPageRef.current - 1
      const data: PageData<MatchMessage> = await fetchMatchMessages(matchId, {
        page: prevPage,
        size: PAGE_SIZE,
      })
      oldestPageRef.current = prevPage
      setState((s) => ({
        ...s,
        messages: prependMessages(s.messages, data.records),
        isLoadingOlder: false,
        hasOlderMessages: prevPage > 1,
      }))
    } catch {
      setState((s) => ({ ...s, isLoadingOlder: false }))
    }
  }, [matchId, state.isLoadingOlder, state.isInitializing, prependMessages])

  // Poll for new messages every POLL_INTERVAL ms
  useEffect(() => {
    if (matchId === null || state.isInitializing) return

    const timer = setInterval(async () => {
      try {
        const currentLatest = latestPageRef.current
        const data: PageData<MatchMessage> = await fetchMatchMessages(matchId, {
          page: currentLatest,
          size: PAGE_SIZE,
        })
        const newTotal = data.total

        if (newTotal > knownTotalRef.current) {
          const newLastPage = Math.ceil(newTotal / PAGE_SIZE)
          knownTotalRef.current = newTotal

          if (newLastPage > currentLatest) {
            // New page(s) appeared - fetch latest page
            const newPageData: PageData<MatchMessage> = await fetchMatchMessages(matchId, {
              page: newLastPage,
              size: PAGE_SIZE,
            })
            latestPageRef.current = newLastPage
            setState((s) => ({
              ...s,
              messages: mergeMessages(s.messages, newPageData.records),
            }))
          } else {
            // New messages on the same last page
            setState((s) => ({
              ...s,
              messages: mergeMessages(s.messages, data.records),
            }))
          }
        }
      } catch {
        // Silently ignore polling errors
      }
    }, POLL_INTERVAL)

    return () => clearInterval(timer)
  }, [matchId, state.isInitializing, mergeMessages])

  // Append a sent message (called after successful send)
  const appendMessage = useCallback((msg: MatchMessage) => {
    setState((s) => ({
      ...s,
      messages: mergeMessages(s.messages, [msg]),
    }))
    knownTotalRef.current += 1
  }, [mergeMessages])

  return {
    ...state,
    loadOlderMessages,
    appendMessage,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MatchChatPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const accountInfo = useAuthStore((s) => s.accountInfo)

  const recordId = id && /^\d+$/.test(id) ? Number(id) : null

  // Record data: prefer router state, fallback to list query
  const stateRecord = (location.state as { record?: MatchRecordItem } | null)?.record
  const needsFetch = !stateRecord && recordId !== null
  const { data: listData, isLoading: listLoading } = useMyMatchRecords(
    { page: 1, size: 100 },
    needsFetch,
  )

  const baseRecord = stateRecord ?? listData?.records.find((r) => r.recordId === recordId)
  const [localStatus, setLocalStatus] = useState<number | null>(null)
  const record: MatchRecordItem | undefined = baseRecord
    ? { ...baseRecord, status: localStatus ?? baseRecord.status }
    : undefined

  // Messages
  const {
    messages,
    isInitializing,
    isLoadingOlder,
    hasOlderMessages,
    initError,
    loadOlderMessages,
    appendMessage,
  } = useChatMessages(recordId)

  // Pending messages (optimistic)
  const [pendingMsgs, setPendingMsgs] = useState<PendingMsg[]>([])
  const tempIdCounter = useRef(0)

  // Send mutation
  const sendMutation = useSendMatchMessage(recordId ?? 0)
  const markReadMutation = useMarkMatchMessagesRead(recordId ?? 0)

  // Input state
  const [text, setText] = useState('')
  const [attachPending, setAttachPending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesTopRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  // Track if we should auto-scroll (only when already at bottom)
  function checkAtBottom() {
    const el = scrollContainerRef.current
    if (!el) return
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  // Scroll to bottom
  function scrollToBottom(smooth = false) {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }

  // On initial load: scroll to bottom
  const didInitScroll = useRef(false)
  useEffect(() => {
    if (!isInitializing && messages.length > 0 && !didInitScroll.current) {
      didInitScroll.current = true
      scrollToBottom()
    }
  }, [isInitializing, messages.length])

  // When new messages arrive via poll: scroll if already at bottom
  const prevMsgCount = useRef(0)
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      if (isAtBottomRef.current) scrollToBottom(true)
      prevMsgCount.current = messages.length
    }
  }, [messages.length])

  // IntersectionObserver: top sentinel for loading older messages
  useEffect(() => {
    const sentinel = messagesTopRef.current
    if (!sentinel || !hasOlderMessages || isInitializing) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Save scroll position before prepend
          const container = scrollContainerRef.current
          const prevScrollHeight = container?.scrollHeight ?? 0

          loadOlderMessages().then(() => {
            // Restore scroll position after prepend so user doesn't jump to top
            if (container) {
              container.scrollTop += container.scrollHeight - prevScrollHeight
            }
          })
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasOlderMessages, isInitializing, loadOlderMessages])

  // Mark messages read when page is visible
  useEffect(() => {
    if (!recordId || isInitializing) return
    markReadMutation.mutate()
  }, [recordId, isInitializing]) // eslint-disable-line react-hooks/exhaustive-deps

  // Send a message
  function doSend(content: string, msgType = 1, attachUrl?: string) {
    if (!content.trim() && msgType === 1) return

    const tempId = `tmp_${(tempIdCounter.current += 1)}`
    const pending: PendingMsg = {
      tempId,
      content: msgType === 1 ? content.trim() : content,
      msgType,
      attachUrl,
      status: 'sending',
    }

    setPendingMsgs((prev) => [...prev, pending])
    scrollToBottom(true)

    sendMutation.mutate(
      { content: msgType === 1 ? content.trim() : content, msgType, attachUrl },
      {
        onSuccess: (msg) => {
          setPendingMsgs((prev) => prev.filter((p) => p.tempId !== tempId))
          if (msg) appendMessage(msg)
          scrollToBottom(true)
        },
        onError: () => {
          setPendingMsgs((prev) =>
            prev.map((p) => (p.tempId === tempId ? { ...p, status: 'failed' } : p)),
          )
        },
      },
    )
  }

  function handleSendText() {
    if (!text.trim()) return
    const content = text
    setText('')
    doSend(content)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setAttachPending(true)
    try {
      const result = await uploadFileWithProgress(file, { bizType: 'MATCH_MESSAGE' })
      doSend(file.name, 2, result.fileUrl)
    } catch {
      // Show error inline - reuse pending system
      const tempId = `tmp_${(tempIdCounter.current += 1)}`
      setPendingMsgs((prev) => [
        ...prev,
        { tempId, content: `[附件: ${file.name}]`, msgType: 2, status: 'failed' },
      ])
    } finally {
      setAttachPending(false)
    }
  }

  // ── Guard: invalid ID ─────────────────────────────────────────────────────

  if (!recordId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-stone-400 text-sm">无效的对接记录 ID</p>
        <Link to="/member/my-records" className="text-sm text-emerald-600 hover:underline">
          返回对接记录
        </Link>
      </div>
    )
  }

  if (listLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-emerald-500" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Icon icon={Handshake} size={32} className="text-stone-200" />
        <p className="text-stone-400 text-sm">未找到该对接记录</p>
        <Link to="/member/my-records" className="text-sm text-emerald-600 hover:underline">
          返回对接记录
        </Link>
      </div>
    )
  }

  const statusMeta = STATUS_META[record.status] ?? {
    label: String(record.status),
    variant: 'default' as BadgeVariant,
  }
  const canChat = CAN_CHAT_STATUSES.has(record.status)
  const myAccountId = accountInfo?.accountId

  return (
    <div
      className="flex flex-col bg-theme-bg"
      style={{ height: 'calc(100dvh - 4rem)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 bg-white shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-stone-500 hover:text-stone-800 transition-colors"
          aria-label="返回"
        >
          <Icon icon={ArrowLeft} size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-800 truncate">
            {record.counterparty?.name ?? '对接沟通'}
          </p>
          <p className="text-xs text-stone-400 truncate">
            {record.resourceTitle && record.demandTitle
              ? `${record.resourceTitle} · ${record.demandTitle}`
              : record.resourceTitle ?? record.demandTitle ?? `#${record.recordId}`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          <Link
            to={`/member/my-records/${record.recordId}`}
            state={{ record }}
            className="text-xs text-stone-400 hover:text-emerald-600 transition-colors"
          >
            详情
          </Link>
        </div>
      </div>

      {/* ── Status action bar ── */}
      <StatusActionBar record={record} onStatusChange={setLocalStatus} />

      {/* ── Messages area ── */}
      <div
        ref={scrollContainerRef}
        onScroll={checkAtBottom}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-0"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* IntersectionObserver sentinel (load older) */}
        <div ref={messagesTopRef} className="h-px" />

        {/* Loading older indicator */}
        {isLoadingOlder && (
          <div className="flex justify-center py-2">
            <Spinner size="sm" className="text-stone-400" />
          </div>
        )}

        {/* No more older messages */}
        {!hasOlderMessages && !isInitializing && messages.length > 0 && (
          <p className="text-center text-xs text-stone-300 py-2">
            — 以上是全部消息 —
          </p>
        )}

        {/* Initial loading */}
        {isInitializing && (
          <div className="flex justify-center py-10">
            <Spinner size="lg" className="text-emerald-500" />
          </div>
        )}

        {/* Init error */}
        {initError && (
          <div className="flex flex-col items-center gap-2 py-10">
            <Icon icon={AlertCircle} size={24} className="text-stone-300" />
            <p className="text-sm text-stone-400">{initError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:underline"
            >
              <Icon icon={RefreshCw} size={12} />
              刷新重试
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isInitializing && !initError && messages.length === 0 && pendingMsgs.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16">
            <Icon icon={Handshake} size={32} className="text-stone-200" />
            <p className="text-sm text-stone-400">
              {canChat ? '还没有消息，发送第一条消息开始沟通吧' : '暂无沟通记录'}
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMine={msg.senderId === myAccountId}
          />
        ))}

        {/* Pending (optimistic) messages */}
        {pendingMsgs.map((msg) => (
          <PendingBubble
            key={msg.tempId}
            msg={msg}
            onRetry={() => {
              setPendingMsgs((prev) => prev.filter((p) => p.tempId !== msg.tempId))
              doSend(msg.content, msg.msgType, msg.attachUrl)
            }}
          />
        ))}

        {/* Bottom anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      {canChat ? (
        <div className="shrink-0 border-t border-stone-100 bg-white px-3 py-2">
          <div className="flex items-end gap-2">
            {/* Attachment button */}
            <button
              type="button"
              disabled={attachPending}
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-40"
              aria-label="发送附件"
            >
              {attachPending ? (
                <Spinner size="sm" className="text-stone-400" />
              ) : (
                <Icon icon={Paperclip} size={18} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={handleFileChange}
            />

            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，Enter 发送，Shift+Enter 换行"
              rows={1}
              className={clsx(
                'flex-1 resize-none rounded-lg border border-stone-200 bg-stone-50 px-3 py-2',
                'text-sm text-stone-800 placeholder:text-stone-400',
                'focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent',
                'max-h-32 overflow-y-auto',
              )}
              style={{ height: 'auto', minHeight: '36px' }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`
              }}
            />

            {/* Send button */}
            <button
              type="button"
              disabled={!text.trim() || sendMutation.isPending}
              onClick={handleSendText}
              className={clsx(
                'shrink-0 h-9 w-9 flex items-center justify-center rounded-lg transition-colors',
                text.trim()
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-stone-100 text-stone-300 cursor-not-allowed',
              )}
              aria-label="发送"
            >
              <Icon icon={Send} size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-t border-stone-100 bg-stone-50 px-4 py-3 text-center text-xs text-stone-400">
          {record.status === 5 && '对接已完成，沟通频道已关闭'}
          {record.status === 6 && '申请已被拒绝，沟通频道已关闭'}
          {record.status === 7 && '对接已撤销，沟通频道已关闭'}
        </div>
      )}
    </div>
  )
}
