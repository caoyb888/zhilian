import { useQuery } from '@tanstack/react-query'
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
