import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import http from './http'
import type { ApiResult, PageData } from '@/types/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecommendTargetMember {
  id: number
  name: string
  memberLevel: number
  province: string | null
}

export interface RecommendItem {
  targetType: string
  targetId: number
  targetTitle: string
  targetMember: RecommendTargetMember | null
  matchScore: number
  matchReasons: string[]
  /** 已向该 target 发起过对接申请 */
  applied: boolean
}

export interface RecommendParams {
  sourceType: 'RESOURCE' | 'DEMAND'
  sourceId: number
  page: number
  size: number
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

// ─── Apply ────────────────────────────────────────────────────────────────────

export interface ApplyMatchBody {
  resourceId: number
  demandId: number
  applyMessage?: string
}

/** Business error codes returned by the match apply endpoint */
export const MATCH_ERROR = {
  SELF_APPLY: 3101,
  DUPLICATE: 3102,
} as const

export function getApplyErrorMsg(error: unknown): string {
  if (isAxiosError<ApiResult>(error)) {
    const code = error.response?.data?.code
    if (code === MATCH_ERROR.SELF_APPLY) return '您与该供需方属于同一会员单位，无法发起自对接'
    if (code === MATCH_ERROR.DUPLICATE) return '已向该目标发起过对接申请，请勿重复提交'
  }
  return '申请发送失败，请稍后重试'
}

export function useApplyMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: ApplyMatchBody) => {
      const res = await http.post<ApiResult<null>>('/match/apply', body)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', 'recommendations'] })
      queryClient.invalidateQueries({ queryKey: ['match', 'records', 'my'] })
    },
  })
}

// ─── Batch Apply（#13 1 对 N）──────────────────────────────────────────────────

export interface BatchApplyMatchBody {
  resourceId?: number
  demandIds?: number[]
  demandId?: number
  resourceIds?: number[]
  applyMessage?: string
}

export interface BatchApplyResult {
  total: number
  success: number
  failed: number
  errors: string[]
}

export function useBatchApplyMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: BatchApplyMatchBody) => {
      const res = await http.post<ApiResult<BatchApplyResult>>('/match/apply-batch', body)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', 'recommendations'] })
      queryClient.invalidateQueries({ queryKey: ['match', 'records', 'my'] })
    },
  })
}

// ─── My Records ───────────────────────────────────────────────────────────────

export interface MatchCounterparty {
  memberId: number
  name: string
  memberLevel: number
  province: string | null
}

export interface MatchRecordItem {
  recordId: number
  resourceId: number
  demandId: number
  resourceTitle: string | null
  demandTitle: string | null
  counterparty: MatchCounterparty | null
  matchScore: number | null
  /** 1=系统推荐 2=主动申请 */
  matchType: number
  /** 1待响应 2已接受 3洽谈中 5已完成 6已拒绝 7已撤销 */
  status: number
  applyMessage: string | null
  isInitiator: boolean
  unreadCount: number
  createdAt: string
  updatedAt: string
}

export interface MyMatchRecordsParams {
  page: number
  size: number
  /** Single status value; backend accepts Integer only */
  status?: number
}

export type RespondAction = 'ACCEPT' | 'REJECT'
export type StatusAction = 'NEGOTIATE' | 'COMPLETE' | 'CANCEL'

export function useRespondMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ recordId, action }: { recordId: number; action: RespondAction }) => {
      const res = await http.patch<ApiResult<{ recordId: number; status: number }>>(
        `/match/records/${recordId}/respond`,
        { action },
      )
      return res.data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['match', 'records', 'my'] }),
  })
}

export function useUpdateMatchStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ recordId, action }: { recordId: number; action: StatusAction }) => {
      const res = await http.patch<ApiResult<{ recordId: number; status: number }>>(
        `/match/records/${recordId}/status`,
        { action },
      )
      return res.data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['match', 'records', 'my'] }),
  })
}

export function useMyMatchRecords(params: MyMatchRecordsParams, enabled = true) {
  return useQuery({
    queryKey: ['match', 'records', 'my', params],
    queryFn: async () => {
      const urlParams = new URLSearchParams()
      urlParams.set('page', String(params.page))
      urlParams.set('size', String(params.size))
      if (params.status !== undefined) urlParams.set('status', String(params.status))
      const res = await http.get<ApiResult<PageData<MatchRecordItem>>>(
        `/match/records/my?${urlParams}`,
      )
      return res.data.data
    },
    enabled,
    placeholderData: (prev) => prev,
  })
}

// ─── Active match check ───────────────────────────────────────────────────────

/** Status values that block a new match application (backend 3102 logic). */
const ACTIVE_STATUSES = new Set([1, 2, 3, 5])

/**
 * Returns the first active match record that involves the given resource or demand,
 * or null when none exists. `enabled` should be false when the user is not logged
 * in or is the owner of the target (so they cannot apply anyway).
 */
export function useActiveMatchRecord(
  targetField: 'resourceId' | 'demandId',
  targetId: number | undefined,
  enabled: boolean,
): MatchRecordItem | null {
  const query = useMyMatchRecords({ page: 1, size: 200 }, enabled && targetId !== undefined)
  return useMemo(() => {
    if (!query.data?.records?.length || targetId === undefined) return null
    return (
      query.data.records.find(
        (r) => ACTIVE_STATUSES.has(r.status) && r[targetField] === targetId,
      ) ?? null
    )
  }, [query.data, targetField, targetId])
}

// ─── Match Messages ───────────────────────────────────────────────────────────

export interface MatchMessage {
  id: number
  matchId: number
  senderId: number
  content: string
  /** 1=文本 2=附件 */
  msgType: number
  attachUrl: string | null
  isRead: boolean
  createdAt: string
}

export interface SendMatchMessageBody {
  content: string
  msgType?: number
  attachUrl?: string
}

export async function fetchMatchMessages(
  matchId: number,
  params: { page: number; size: number },
): Promise<PageData<MatchMessage>> {
  const res = await http.get<ApiResult<PageData<MatchMessage>>>(
    `/match/records/${matchId}/messages`,
    { params },
  )
  return res.data.data
}

export function useSendMatchMessage(matchId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: SendMatchMessageBody) => {
      const res = await http.post<ApiResult<MatchMessage>>(
        `/match/records/${matchId}/messages`,
        body,
      )
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', 'records', 'my'] })
    },
  })
}

export function useMarkMatchMessagesRead(matchId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await http.patch<ApiResult<{ markedCount: number }>>(
        `/match/records/${matchId}/messages/read`,
      )
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', 'records', 'my'] })
    },
  })
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export function useRecommendations(params: RecommendParams, enabled: boolean) {
  return useQuery({
    queryKey: ['match', 'recommendations', params],
    queryFn: async () => {
      const res = await http.get<ApiResult<PageData<RecommendItem>>>('/match/recommendations', {
        params,
      })
      return res.data.data
    },
    enabled,
    placeholderData: (prev) => prev,
  })
}
