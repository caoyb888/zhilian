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
