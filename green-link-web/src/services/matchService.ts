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
