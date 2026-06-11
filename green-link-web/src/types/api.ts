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

// ─── Admin Dashboard types (S7-01 ~ S7-05) ───────────────────────────────────

export interface DashboardOverviewVO {
  totalMembers: number
  newMembersThisMonth: number
  pendingAuditCount: number
  totalMatchCount: number
  matchSuccessRate: number
}

export interface AuditDailyStat {
  date: string
  auditedCount: number
}

export interface AuditSummaryVO {
  pendingResourceCount: number
  pendingDemandCount: number
  totalPendingAudit: number
  last7DaysAudit: AuditDailyStat[]
}

export interface MatchTrendDailyStat {
  date: string
  newMatchCount: number
}

export interface MatchDetailStatsVO {
  totalMatchCount: number
  completedMatchCount: number
  successRate: number
  last30DaysTrend: MatchTrendDailyStat[]
}

export interface IndustryDistStat {
  industry: string
  count: number
}

export interface MemberDetailStatsVO {
  totalMembers: number
  newMembersThisMonth: number
  industryDistribution: IndustryDistStat[]
}

export interface ChannelStatDTO {
  totalProcessed: number
  successCount: number
  failedCount: number
  successRate: number
}

export interface MessageStatsVO {
  site: ChannelStatDTO
  wechat: ChannelStatDTO
}

// ─────────────────────────────────────────────────────────────────────────────

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
