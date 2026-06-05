export interface ApiResult<T = null> {
  code: number
  msg: string
  data: T
  timestamp: number
}

export interface AccountInfo {
  accountId: number
  memberId: number
  username: string
  realName: string | null
  avatarUrl: string | null
  roles: string[]
  memberName: string
  memberLevel: number
}

export interface LoginData {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
  accountInfo: AccountInfo
}

export interface CaptchaData {
  captchaToken: string
  imageBase64: string
  expireIn: number
}

export interface SmsCodeData {
  expireIn: number
}

export interface PageData<T> {
  records: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface MeProfile {
  accountId: number
  memberId: number
  username: string
  realName: string | null
  avatarUrl: string | null
  roles: string[]
  permissions: string[]
  memberName: string
  memberLevel: number
}

export type AdminRole = 'SUPER_ADMIN' | 'CONTENT_ADMIN' | 'AUDITOR' | 'FINANCE'
export type MemberRole = 'MEMBER' | 'VIP_MEMBER' | 'EXPERT'

export const ADMIN_ROLES: string[] = ['SUPER_ADMIN', 'CONTENT_ADMIN', 'AUDITOR', 'FINANCE']

export interface MemberTagItem {
  id: number
  name: string
  categoryCode: string
}

export interface MemberItem {
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
  tags: MemberTagItem[]
  createdAt: string
}

export interface MemberDetailItem extends MemberItem {
  introduction: string | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  joinDate: string | null
}
