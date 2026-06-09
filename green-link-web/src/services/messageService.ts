import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import http from './http'
import type { ApiResult, PageData } from '@/types/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BizType = 'MATCH' | 'AUDIT' | 'ACTIVITY' | 'SYSTEM'

export interface NotificationItem {
  id: number
  accountId: number
  bizType: BizType | null
  bizId: number | null
  title: string
  content: string | null
  channel: string
  isRead: boolean
  readAt: string | null
  sendStatus: number
  sendAt: string | null
  createdAt: string
}

export interface UnreadCountData {
  MATCH: number
  AUDIT: number
  ACTIVITY: number
  SYSTEM: number
  total: number
}

export interface NotificationsParams {
  page: number
  size: number
  bizType?: BizType
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useNotifications(params: NotificationsParams) {
  return useQuery({
    queryKey: ['messages', 'list', params],
    queryFn: async () => {
      const p = new URLSearchParams()
      p.set('page', String(params.page))
      p.set('size', String(params.size))
      if (params.bizType) p.set('bizType', params.bizType)
      const res = await http.get<ApiResult<PageData<NotificationItem>>>(`/messages?${p}`)
      return res.data.data
    },
    placeholderData: (prev) => prev,
  })
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: async () => {
      const res = await http.get<ApiResult<UnreadCountData>>('/messages/unread-count')
      return res.data.data
    },
    enabled,
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (messageId: number) => {
      await http.patch(`/messages/${messageId}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bizType?: BizType) => {
      await http.patch('/messages/read-all', bizType ? { bizType } : {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}
