import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import http from './http'
import type { ApiResult, PageData, MemberItem, MemberDetailItem } from '@/types/api'

export interface MemberListParams {
  page: number
  size: number
  keyword?: string
  status?: number
  memberLevel?: number
}

export function useAdminMemberList(params: MemberListParams) {
  return useQuery({
    queryKey: ['admin', 'members', params],
    queryFn: async () => {
      const res = await http.get<ApiResult<PageData<MemberItem>>>('/members', { params })
      return res.data.data
    },
  })
}

export function useMemberDetail(memberId: number | null) {
  return useQuery({
    queryKey: ['admin', 'member-detail', memberId],
    queryFn: async () => {
      const res = await http.get<ApiResult<MemberDetailItem>>(`/members/${memberId}`)
      return res.data.data
    },
    enabled: memberId !== null,
  })
}

export function useAuditMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      memberId,
      action,
      remark,
    }: {
      memberId: number
      action: 'APPROVE' | 'REJECT'
      remark?: string
    }) => {
      await http.post(`/members/${memberId}/audit`, { action, remark: remark || undefined })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'members'] })
    },
  })
}

export function useUpdateMemberStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId, status }: { memberId: number; status: 0 | 1 }) => {
      await http.patch(`/members/${memberId}/status`, { status })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'members'] })
    },
  })
}
