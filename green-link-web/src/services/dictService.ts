import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import http from './http'
import type { ApiResult } from '@/types/api'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DictItem {
  id: number
  typeCode: string
  value: string
  label: string
  parentValue: string | null
  sortOrder: number
  isActive: boolean
}

export interface DictType {
  id: number
  code: string
  name: string
  remark: string | null
  isActive: boolean
}

export interface CreateDictItemRequest {
  typeCode: string
  value: string
  label: string
  parentValue?: string
  sortOrder?: number
}

export interface UpdateDictItemRequest {
  label?: string
  parentValue?: string
  sortOrder?: number
  isActive?: boolean
}

// 常用字典类型编码
export const DICT_RESOURCE_TYPE = 'RESOURCE_TYPE'
export const DICT_DEMAND_TYPE = 'DEMAND_TYPE'

// ─── 公开读取（前端下拉） ───────────────────────────────────────────────────────

export function useDictOptions(typeCode: string) {
  return useQuery({
    queryKey: ['dict', 'options', typeCode],
    queryFn: async () => {
      const res = await http.get<ApiResult<DictItem[]>>(`/dict/options/${typeCode}`)
      return res.data.data
    },
    staleTime: 5 * 60 * 1000, // 字典变动少，缓存 5 分钟
  })
}

/**
 * 返回 value→label 解析函数；字典未命中时回退到传入的 legacy 映射，再回退到原始值。
 */
export function useDictLabel(typeCode: string, legacy?: Record<string, string>) {
  const { data } = useDictOptions(typeCode)
  const map: Record<string, string> = { ...(legacy ?? {}) }
  ;(data ?? []).forEach((it) => {
    map[it.value] = it.label
  })
  return (value: string | null | undefined): string =>
    value ? map[value] ?? value : ''
}

// ─── 管理端 CRUD ────────────────────────────────────────────────────────────

export function useDictTypes() {
  return useQuery({
    queryKey: ['dict', 'types'],
    queryFn: async () => {
      const res = await http.get<ApiResult<DictType[]>>('/dict/types')
      return res.data.data
    },
  })
}

export function useDictItems(typeCode: string | null) {
  return useQuery({
    queryKey: ['dict', 'items', typeCode],
    enabled: !!typeCode,
    queryFn: async () => {
      const res = await http.get<ApiResult<DictItem[]>>(`/dict/types/${typeCode}/items`)
      return res.data.data
    },
  })
}

function invalidateDict(qc: ReturnType<typeof useQueryClient>, typeCode: string) {
  qc.invalidateQueries({ queryKey: ['dict', 'items', typeCode] })
  qc.invalidateQueries({ queryKey: ['dict', 'options', typeCode] })
}

export function useCreateDictItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateDictItemRequest) => {
      const res = await http.post<ApiResult<DictItem>>('/dict/items', body)
      return res.data.data
    },
    onSuccess: (_d, vars) => invalidateDict(qc, vars.typeCode),
  })
}

export function useUpdateDictItem(typeCode: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: UpdateDictItemRequest }) => {
      const res = await http.put<ApiResult<DictItem>>(`/dict/items/${id}`, body)
      return res.data.data
    },
    onSuccess: () => invalidateDict(qc, typeCode),
  })
}

export function useDeleteDictItem(typeCode: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await http.delete<ApiResult<null>>(`/dict/items/${id}`)
    },
    onSuccess: () => invalidateDict(qc, typeCode),
  })
}
