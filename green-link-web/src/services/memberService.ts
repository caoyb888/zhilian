import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import http from './http'
import type { ApiResult, MeProfile } from '@/types/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberMe {
  accountId: number
  username: string
  realName: string | null
  phone: string | null
  email: string | null
  avatarUrl: string | null
  roles: string[]
  permissions: string[]
  member: {
    id: number
    name: string
    memberLevel: number
    status: number
  }
  isMainAccount: boolean
  lastLoginAt: string | null
}

export interface MemberDetail {
  id: number
  name: string
  shortName: string | null
  industry: string
  memberLevel: number
  memberLevelName: string
  province: string | null
  city: string | null
  logoUrl: string | null
  isCertified: boolean
  status: number
  tags: Array<{ id: number; name: string; categoryCode: string }>
  introduction: string | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  joinDate: string | null
  createdAt: string
}

export interface UpdateMemberBody {
  shortName?: string
  industry?: string
  province?: string
  city?: string
  introduction?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  logoUrl?: string
  tagIds?: number[]
}

export interface FileUploadResult {
  fileId: number
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** 当前登录账号完整信息（含手机/邮箱脱敏、isMainAccount） */
export function useMemberMe() {
  return useQuery({
    queryKey: ['member', 'me'],
    queryFn: async () => {
      const res = await http.get<ApiResult<MemberMe>>('/members/me')
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

/** 会员单位详情（含联系方式、简介、标签） */
export function useMemberDetail(memberId: number | null) {
  return useQuery({
    queryKey: ['member', 'detail', memberId],
    queryFn: async () => {
      const res = await http.get<ApiResult<MemberDetail>>(`/members/${memberId}`)
      return res.data.data
    },
    enabled: memberId !== null,
    staleTime: 3 * 60 * 1000,
  })
}

/** 更新会员单位信息（主账号或管理员） */
export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId, data }: { memberId: number; data: UpdateMemberBody }) => {
      await http.put(`/members/${memberId}`, data)
    },
    onSuccess: (_res, { memberId }) => {
      qc.invalidateQueries({ queryKey: ['member', 'detail', memberId] })
      qc.invalidateQueries({ queryKey: ['member', 'me'] })
    },
  })
}

/** 上传文件（图片/PDF 等），返回 fileId 和 fileUrl */
export function useUploadFile() {
  return useMutation({
    mutationFn: async ({
      file,
      bizType,
      bizId,
    }: {
      file: File
      bizType?: string
      bizId?: number
    }) => {
      const formData = new FormData()
      formData.append('file', file)
      if (bizType) formData.append('bizType', bizType)
      if (bizId !== undefined) formData.append('bizId', String(bizId))
      // Let axios set Content-Type with correct boundary for multipart
      const res = await http.post<ApiResult<FileUploadResult>>('/files/upload', formData, {
        headers: { 'Content-Type': undefined as unknown as string },
      })
      return res.data.data
    },
  })
}

// ─── Sub-account Types & Hooks ────────────────────────────────────────────────

export interface SubAccount {
  id: number
  memberId: number
  parentId: number | null
  username: string
  realName: string | null
  phone: string | null
  avatarUrl: string | null
  status: number
  roles: string[]
  lastLoginAt: string | null
  createdAt: string
}

export interface CreateSubAccountBody {
  username: string
  password: string
  realName?: string
  phone?: string
}

export function useSubAccounts(memberId: number | null) {
  return useQuery({
    queryKey: ['member', 'sub-accounts', memberId],
    queryFn: async () => {
      const res = await http.get<ApiResult<SubAccount[]>>(`/members/${memberId}/sub-accounts`)
      return res.data.data
    },
    enabled: memberId !== null,
    staleTime: 60 * 1000,
  })
}

export function useCreateSubAccount(memberId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateSubAccountBody) => {
      const res = await http.post<ApiResult<SubAccount>>(`/members/${memberId}/sub-accounts`, data)
      return res.data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['member', 'sub-accounts', memberId] })
    },
  })
}

export function useUpdateSubAccountStatus(memberId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ accountId, status }: { accountId: number; status: number }) => {
      await http.patch(`/members/${memberId}/sub-accounts/${accountId}`, { status })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['member', 'sub-accounts', memberId] })
    },
  })
}

// ─── Legacy (used by auth flow for permissions) ───────────────────────────────

export async function fetchMyProfile(): Promise<MeProfile> {
  const res = await http.get<ApiResult<MeProfile>>('/members/me')
  return res.data.data
}
