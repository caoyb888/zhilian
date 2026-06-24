import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import http from './http'
import type { ApiResult, PageData } from '@/types/api'

interface TagSimpleVO {
  id: number
  name: string
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminSupplyListParams {
  page: number
  size: number
  keyword?: string
  type?: string
  auditStatus?: number
}

export interface AdminResourceVO {
  id: number
  memberId: number
  accountId: number
  type: string
  title: string
  summary: string | null
  province: string | null
  city: string | null
  validUntil: string | null
  viewCount: number
  auditStatus: number
  auditRemark: string | null
  auditorId: number | null
  auditedAt: string | null
  createdAt: string
  tags: TagSimpleVO[]
}

export interface AdminDemandVO {
  id: number
  memberId: number
  accountId: number
  type: string
  title: string
  summary: string | null
  province: string | null
  budgetMin: number | null
  budgetMax: number | null
  deadline: string | null
  viewCount: number
  auditStatus: number
  auditRemark: string | null
  auditorId: number | null
  auditedAt: string | null
  createdAt: string
  tags: TagSimpleVO[]
}

// ─── Resource admin hooks ─────────────────────────────────────────────────────

export function useAdminResourceList(params: AdminSupplyListParams) {
  return useQuery({
    queryKey: ['admin', 'supply', 'resources', params],
    queryFn: async () => {
      const clean: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '' && v !== -1) clean[k] = v
      }
      const res = await http.get<ApiResult<PageData<AdminResourceVO>>>('/admin/supply/resources', { params: clean })
      return res.data.data
    },
  })
}

export function useAuditResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, action, remark }: { id: number; action: 'APPROVE' | 'REJECT'; remark?: string }) => {
      if (action === 'APPROVE') {
        await http.patch(`/admin/supply/resources/${id}/approve`)
      } else {
        await http.patch(`/admin/supply/resources/${id}/reject`, { remark })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'supply', 'resources'] }),
  })
}

// 批量审核结果（#6）
export interface BatchAuditResult {
  total: number
  success: number
  failed: number
  errors: string[]
}

export function useBatchAuditResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, action, remark }: { ids: number[]; action: 'APPROVE' | 'REJECT'; remark?: string }) => {
      const path = action === 'APPROVE' ? 'batch-approve' : 'batch-reject'
      const res = await http.patch<ApiResult<BatchAuditResult>>(`/admin/supply/resources/${path}`, { ids, remark })
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'supply', 'resources'] }),
  })
}

// ─── Demand admin hooks ───────────────────────────────────────────────────────

export function useAdminDemandList(params: AdminSupplyListParams) {
  return useQuery({
    queryKey: ['admin', 'supply', 'demands', params],
    queryFn: async () => {
      const clean: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '' && v !== -1) clean[k] = v
      }
      const res = await http.get<ApiResult<PageData<AdminDemandVO>>>('/admin/supply/demands', { params: clean })
      return res.data.data
    },
  })
}

export function useAuditDemand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, action, remark }: { id: number; action: 'APPROVE' | 'REJECT'; remark?: string }) => {
      if (action === 'APPROVE') {
        await http.patch(`/admin/supply/demands/${id}/approve`)
      } else {
        await http.patch(`/admin/supply/demands/${id}/reject`, { remark })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'supply', 'demands'] }),
  })
}

export function useBatchAuditDemand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, action, remark }: { ids: number[]; action: 'APPROVE' | 'REJECT'; remark?: string }) => {
      const path = action === 'APPROVE' ? 'batch-approve' : 'batch-reject'
      const res = await http.patch<ApiResult<BatchAuditResult>>(`/admin/supply/demands/${path}`, { ids, remark })
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'supply', 'demands'] }),
  })
}
