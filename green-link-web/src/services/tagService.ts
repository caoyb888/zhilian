import http from './http'
import type { ApiResult, PageData } from '@/types/api'

export interface TagCategory {
  id: number
  code: string
  name: string
  sortOrder: number
  tags?: Tag[]
}

export interface Tag {
  id: number
  categoryId: number
  categoryCode?: string
  name: string
  alias: string | null
  sortOrder: number
  isActive: boolean
  isDeleted?: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateCategoryRequest {
  code: string
  name: string
  sortOrder: number
}

export interface UpdateCategoryRequest {
  code: string
  name: string
  sortOrder: number
}

export interface CreateTagRequest {
  categoryId: number
  name: string
  alias?: string
  sortOrder: number
}

export interface UpdateTagRequest {
  categoryId: number
  name: string
  alias?: string
  sortOrder: number
}

export async function fetchTagCategories(): Promise<TagCategory[]> {
  const res = await http.get<ApiResult<TagCategory[]>>('/tag-categories')
  return res.data.data
}

export async function createTagCategory(data: CreateCategoryRequest): Promise<TagCategory> {
  const res = await http.post<ApiResult<TagCategory>>('/tag-categories', data)
  return res.data.data
}

export async function updateTagCategory(id: number, data: UpdateCategoryRequest): Promise<TagCategory> {
  const res = await http.put<ApiResult<TagCategory>>(`/tag-categories/${id}`, data)
  return res.data.data
}

export async function deleteTagCategory(id: number): Promise<void> {
  await http.delete<ApiResult<null>>(`/tag-categories/${id}`)
}

export async function fetchTags(params: { page?: number; size?: number; categoryId?: number; keyword?: string }): Promise<PageData<Tag>> {
  const res = await http.get<ApiResult<PageData<Tag>>>('/tags', { params })
  return res.data.data
}

export async function fetchTagDetail(id: number): Promise<Tag> {
  const res = await http.get<ApiResult<Tag>>(`/tags/${id}`)
  return res.data.data
}

export async function createTag(data: CreateTagRequest): Promise<Tag> {
  const res = await http.post<ApiResult<Tag>>('/tags', data)
  return res.data.data
}

export async function updateTag(id: number, data: UpdateTagRequest): Promise<Tag> {
  const res = await http.put<ApiResult<Tag>>(`/tags/${id}`, data)
  return res.data.data
}

export async function deleteTag(id: number): Promise<void> {
  await http.delete<ApiResult<null>>(`/tags/${id}`)
}
