import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import http from './http'
import type { ApiResult, PageData } from '@/types/api'

// ─── Constants ────────────────────────────────────────────────────────────────

export type ResourceType = 'PRODUCT' | 'TECHNOLOGY' | 'TALENT'
export type DemandType = 'PRODUCT' | 'TECHNOLOGY' | 'TALENT'

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  PRODUCT: '产品/物资',
  TECHNOLOGY: '技术/专利',
  TALENT: '人才/团队',
}

export const DEMAND_TYPE_LABELS: Record<string, string> = {
  PRODUCT: '产品需求',
  TECHNOLOGY: '技术需求',
  TALENT: '人才需求',
}

export const RESOURCE_TYPES: ResourceType[] = ['PRODUCT', 'TECHNOLOGY', 'TALENT']
export const DEMAND_TYPES: DemandType[] = ['PRODUCT', 'TECHNOLOGY', 'TALENT']

export const PROVINCES = [
  '山东', '北京', '上海', '广东', '江苏', '浙江', '河南', '四川',
  '湖北', '湖南', '河北', '安徽', '福建', '辽宁', '陕西', '重庆',
  '天津', '新疆', '内蒙古', '甘肃', '云南', '贵州', '吉林', '黑龙江',
]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResourceTagItem {
  id: number
  name: string
}

export interface ResourceItem {
  id: number
  memberId: number
  type: string
  title: string
  summary: string | null
  province: string | null
  city: string | null
  cooperationMode: string | null
  validUntil: string | null
  viewCount: number
  auditStatus: number
  memberName: string | null
  createdAt: string
  tags: ResourceTagItem[]
  highlightTitle: string | null
  highlightSummary: string | null
}

export interface AttachmentItem {
  id: number
  fileName: string
  fileUrl: string
  fileSize: number | null
  fileType: string | null
  sortOrder: number
}

export interface ResourceDetail {
  id: number
  memberId: number
  accountId: number
  type: string
  title: string
  content: string | null
  summary: string | null
  province: string | null
  city: string | null
  cooperationMode: string | null
  validUntil: string | null
  viewCount: number
  contactVisible: number
  auditStatus: number
  auditRemark: string | null
  createdAt: string
  updatedAt: string | null
  attachments: AttachmentItem[]
  tags: ResourceTagItem[]
  isFavorited?: boolean
}

export interface DemandItem {
  id: number
  memberId: number
  type: string
  title: string
  summary: string | null
  province: string | null
  budgetMin: number | null
  budgetMax: number | null
  deadline: string | null
  cooperationMode: string | null
  viewCount: number
  auditStatus: number
  memberName: string | null
  createdAt: string
  tags: ResourceTagItem[]
  highlightTitle: string | null
  highlightSummary: string | null
  isFavorited?: boolean
}

export interface DemandDetail {
  id: number
  memberId: number
  accountId: number
  type: string
  title: string
  content: string | null
  summary: string | null
  province: string | null
  budgetMin: number | null
  budgetMax: number | null
  deadline: string | null
  cooperationMode: string | null
  viewCount: number
  auditStatus: number
  auditRemark: string | null
  createdAt: string
  updatedAt: string | null
  attachments: AttachmentItem[]
  tags: ResourceTagItem[]
  isFavorited?: boolean
}

export interface ResourceListParams {
  page: number
  size: number
  keyword?: string
  type?: string
  province?: string
  tagId?: number
}

export interface DemandListParams {
  page: number
  size: number
  keyword?: string
  type?: string
  province?: string
  tagId?: number
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export interface CreateResourceBody {
  type: string
  title: string
  content?: string
  summary?: string
  province?: string
  city?: string
  cooperationMode?: string
  validUntil?: string
  contactVisible?: boolean
  tagIds?: number[]
  attachments?: {
    fileName: string
    fileUrl: string
    fileSize?: number | null
    fileType?: string | null
    sortOrder?: number
  }[]
}

export function useCreateResource() {
  return useMutation({
    mutationFn: async (body: CreateResourceBody) => {
      const res = await http.post<ApiResult<ResourceDetail>>('/supply/resources', body)
      return res.data.data
    },
  })
}

export function useResourceDetail(id: number | null) {
  return useQuery({
    queryKey: ['supply', 'resource', 'detail', id],
    queryFn: async () => {
      const res = await http.get<ApiResult<ResourceDetail>>(`/supply/resources/${id}`)
      return res.data.data
    },
    enabled: id !== null,
  })
}

export function useResourceList(params: ResourceListParams) {
  return useQuery({
    queryKey: ['supply', 'resources', params],
    queryFn: async () => {
      const clean: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '' && v !== 0) clean[k] = v
      }
      const res = await http.get<ApiResult<PageData<ResourceItem>>>('/supply/resources', {
        params: clean,
      })
      return res.data.data
    },
    placeholderData: (prev) => prev,
  })
}

export function useFavoriteResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (resourceId: number) =>
      http.post('/favorites', { bizType: 'RESOURCE', bizId: resourceId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites', 'RESOURCE'] }),
  })
}

export function useUnfavoriteResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (resourceId: number) =>
      http.delete('/favorites', { data: { bizType: 'RESOURCE', bizId: resourceId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites', 'RESOURCE'] }),
  })
}

// ─── Demand Hooks ─────────────────────────────────────────────────────────────

export interface CreateDemandBody {
  type: string
  title: string
  content?: string
  summary?: string
  province?: string
  budgetMin?: number | null
  budgetMax?: number | null
  deadline?: string
  cooperationMode?: string
  tagIds?: number[]
  attachments?: {
    fileName: string
    fileUrl: string
    fileSize?: number | null
    fileType?: string | null
    sortOrder?: number
  }[]
}

export function useCreateDemand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateDemandBody) => {
      const res = await http.post<ApiResult<DemandDetail>>('/supply/demands', body)
      return res.data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supply', 'demands'] }),
  })
}

export function useDemandDetail(id: number | null) {
  return useQuery({
    queryKey: ['supply', 'demand', 'detail', id],
    queryFn: async () => {
      const res = await http.get<ApiResult<DemandDetail>>(`/supply/demands/${id}`)
      return res.data.data
    },
    enabled: id !== null,
  })
}

export function useDemandList(params: DemandListParams) {
  return useQuery({
    queryKey: ['supply', 'demands', params],
    queryFn: async () => {
      const clean: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '' && v !== 0) clean[k] = v
      }
      const res = await http.get<ApiResult<PageData<DemandItem>>>('/supply/demands', {
        params: clean,
      })
      return res.data.data
    },
    placeholderData: (prev) => prev,
  })
}

export function useFavoriteDemand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (demandId: number) =>
      http.post('/favorites', { bizType: 'DEMAND', bizId: demandId }),
    onSuccess: (_data, demandId) => {
      queryClient.invalidateQueries({ queryKey: ['supply', 'demand', 'detail', demandId] })
      queryClient.invalidateQueries({ queryKey: ['supply', 'demands'] })
      queryClient.invalidateQueries({ queryKey: ['favorites', 'DEMAND'] })
    },
  })
}

export function useUnfavoriteDemand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (demandId: number) =>
      http.delete('/favorites', { data: { bizType: 'DEMAND', bizId: demandId } }),
    onSuccess: (_data, demandId) => {
      queryClient.invalidateQueries({ queryKey: ['supply', 'demand', 'detail', demandId] })
      queryClient.invalidateQueries({ queryKey: ['supply', 'demands'] })
      queryClient.invalidateQueries({ queryKey: ['favorites', 'DEMAND'] })
    },
  })
}

// ─── Favorites List ────────────────────────────────────────────────────────────

export interface FavoriteItem {
  favoriteId: number
  bizType: 'RESOURCE' | 'DEMAND'
  bizId: number
  title: string
  summary: string | null
  type: string
  createdAt: string
}

export function useFavoriteList(bizType: 'RESOURCE' | 'DEMAND', page: number, size: number) {
  return useQuery({
    queryKey: ['favorites', bizType, page, size],
    queryFn: async () => {
      const res = await http.get<ApiResult<PageData<FavoriteItem>>>('/favorites', {
        params: { bizType, page, size },
      })
      return res.data.data
    },
    placeholderData: (prev) => prev,
  })
}

export function useFavoriteIds(bizType: 'RESOURCE' | 'DEMAND', enabled: boolean) {
  return useQuery({
    queryKey: ['favorites', 'ids', bizType],
    queryFn: async () => {
      const res = await http.get<ApiResult<number[]>>('/favorites/ids', { params: { bizType } })
      return res.data.data ?? []
    },
    enabled,
    staleTime: 0,
  })
}

// ─── Mine Hooks ───────────────────────────────────────────────────────────────

export interface MySupplyListParams {
  page: number
  size: number
  auditStatus?: number
  type?: string
}

export function useMyResources(params: MySupplyListParams) {
  return useQuery({
    queryKey: ['supply', 'resources', 'mine', params],
    queryFn: async () => {
      const clean: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '' && v !== -1) clean[k] = v
      }
      const res = await http.get<ApiResult<PageData<ResourceItem>>>('/supply/resources/mine', {
        params: clean,
      })
      return res.data.data
    },
    placeholderData: (prev) => prev,
  })
}

export function useMyDemands(params: MySupplyListParams) {
  return useQuery({
    queryKey: ['supply', 'demands', 'mine', params],
    queryFn: async () => {
      const clean: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '' && v !== -1) clean[k] = v
      }
      const res = await http.get<ApiResult<PageData<DemandItem>>>('/supply/demands/mine', {
        params: clean,
      })
      return res.data.data
    },
    placeholderData: (prev) => prev,
  })
}

export function useWithdrawResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => http.patch(`/supply/resources/${id}/withdraw`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supply', 'resources', 'mine'] }),
  })
}

export function useDeleteResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => http.delete(`/supply/resources/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supply', 'resources', 'mine'] }),
  })
}

export function useCloseDemand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => http.patch(`/supply/demands/${id}/close`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supply', 'demands', 'mine'] }),
  })
}

export function useDeleteDemand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => http.delete(`/supply/demands/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supply', 'demands', 'mine'] }),
  })
}
