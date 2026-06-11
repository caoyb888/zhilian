import { useQuery } from '@tanstack/react-query'
import http from './http'
import type {
  ApiResult,
  DashboardOverviewVO,
  AuditSummaryVO,
  MatchDetailStatsVO,
  MemberDetailStatsVO,
  MessageStatsVO,
} from '@/types/api'

const BASE = '/admin/dashboard'

export function useDashboardOverview(refetchInterval?: number) {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'overview'],
    queryFn: async () => {
      const res = await http.get<ApiResult<DashboardOverviewVO>>(`${BASE}/overview`)
      return res.data.data
    },
    refetchInterval,
  })
}

export function useAuditSummary(refetchInterval?: number) {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'audit-summary'],
    queryFn: async () => {
      const res = await http.get<ApiResult<AuditSummaryVO>>(`${BASE}/audit-summary`)
      return res.data.data
    },
    refetchInterval,
  })
}

export function useMatchDetailStats(refetchInterval?: number) {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'match-stats'],
    queryFn: async () => {
      const res = await http.get<ApiResult<MatchDetailStatsVO>>(`${BASE}/match-stats`)
      return res.data.data
    },
    refetchInterval,
  })
}

export function useMemberDetailStats(refetchInterval?: number) {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'member-stats'],
    queryFn: async () => {
      const res = await http.get<ApiResult<MemberDetailStatsVO>>(`${BASE}/member-stats`)
      return res.data.data
    },
    refetchInterval,
  })
}

export function useMessageStats(refetchInterval?: number) {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'message-stats'],
    queryFn: async () => {
      const res = await http.get<ApiResult<MessageStatsVO>>(`${BASE}/message-stats`)
      return res.data.data
    },
    refetchInterval,
  })
}
