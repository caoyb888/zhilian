import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import http from './http'
import type { ApiResult, PageData } from '@/types/api'
import type { ResourceItem, DemandItem } from './supplyService'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminSupplyListParams {
  page: number
  size: number
  keyword?: string
  type?: string
  auditStatus?: number
}

export interface AuditAction {
  action: 'APPROVE' | 'REJECT'
  remark?: string
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
      const res = await http.get<ApiResult<PageData<ResourceItem>>>('/supply/resources', { params: clean })
      return res.data.data
    },
  })
}

export function useAuditResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number } & AuditAction) => {
      await http.post(`/supply/resources/${id}/audit`, body)
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
      const res = await http.get<ApiResult<PageData<DemandItem>>>('/supply/demands', { params: clean })
      return res.data.data
    },
  })
}

export function useAuditDemand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number } & AuditAction) => {
      await http.post(`/supply/demands/${id}/audit`, body)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'supply', 'demands'] }),
  })
}
