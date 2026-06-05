import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import http from './http'
import type { ApiResult } from '@/types/api'

// ─── types ────────────────────────────────────────────────────────────────────

export interface ArticleItem {
  id: number
  categoryId: number
  categoryName: string
  title: string
  summary: string | null
  coverUrl: string | null
  author: string | null
  viewCount: number
  isTop: boolean
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}

export interface ArticleDetail extends ArticleItem {
  content: string | null
  sourceUrl: string | null
}

// MyBatis-Plus Page shape (uses `current` not `page`)
export interface MbPage<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export interface CategoryItem {
  id: number
  parentId: number | null
  name: string
  code: string
  sortOrder: number
  isVisible: boolean
  children: CategoryItem[]
}

export type PublishMode = 'DRAFT' | 'NOW' | 'SCHEDULED'

export interface ArticleListParams {
  page: number
  size: number
  keyword?: string
  categoryId?: number
  isTop?: boolean
  published?: boolean
}

export interface CreateArticleBody {
  categoryId: number
  title: string
  content?: string
  summary?: string
  coverUrl?: string
  author?: string
  sourceUrl?: string
  isTop: boolean
  publishMode: PublishMode
  scheduledAt?: string
}

export interface UpdateArticleBody {
  categoryId?: number
  title?: string
  content?: string
  summary?: string
  coverUrl?: string
  author?: string
  sourceUrl?: string
  isTop?: boolean
}

// ─── hooks ────────────────────────────────────────────────────────────────────

export function useArticleList(params: ArticleListParams) {
  return useQuery({
    queryKey: ['admin', 'articles', params],
    queryFn: async () => {
      const res = await http.get<ApiResult<MbPage<ArticleItem>>>('/portal/articles', { params })
      return res.data.data
    },
  })
}

export function useArticleDetail(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'article-detail', id],
    queryFn: async () => {
      const res = await http.get<ApiResult<ArticleDetail>>(`/portal/articles/${id}`)
      return res.data.data
    },
    enabled: id !== null,
  })
}

export function usePortalCategories() {
  return useQuery({
    queryKey: ['portal', 'categories'],
    queryFn: async () => {
      const res = await http.get<ApiResult<CategoryItem[]>>('/portal-categories')
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateArticleBody) => {
      const res = await http.post<ApiResult<ArticleDetail>>('/portal/articles', data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'articles'] }),
  })
}

export function useUpdateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateArticleBody }) => {
      const res = await http.put<ApiResult<ArticleDetail>>(`/portal/articles/${id}`, data)
      return res.data.data
    },
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'articles'] })
      qc.invalidateQueries({ queryKey: ['admin', 'article-detail', id] })
    },
  })
}

export function useDeleteArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await http.delete(`/portal/articles/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'articles'] }),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg ?? '删除失败'
      alert(msg)
    },
  })
}

export function usePublishArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await http.patch(`/portal/articles/${id}/publish`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'articles'] }),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg ?? '发布失败'
      alert(msg)
    },
  })
}

export function useUnpublishArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await http.patch(`/portal/articles/${id}/unpublish`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'articles'] }),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg ?? '操作失败'
      alert(msg)
    },
  })
}
