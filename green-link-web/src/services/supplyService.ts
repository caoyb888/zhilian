import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import http from './http'
import type { ApiResult, PageData } from '@/types/api'

// ─── Constants ────────────────────────────────────────────────────────────────

export type ResourceType = 'PRODUCT' | 'TECHNOLOGY' | 'TALENT'

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  PRODUCT: '产品/物资',
  TECHNOLOGY: '技术/专利',
  TALENT: '人才/团队',
}

export const RESOURCE_TYPES: ResourceType[] = ['PRODUCT', 'TECHNOLOGY', 'TALENT']

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
}

export interface ResourceListParams {
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
      http.post('/match/favorites', { bizType: 'RESOURCE', bizId: resourceId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites', 'RESOURCE'] }),
  })
}

export function useUnfavoriteResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (resourceId: number) =>
      http.delete(`/match/favorites/RESOURCE/${resourceId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites', 'RESOURCE'] }),
  })
}
