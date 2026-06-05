import http from './http'
import type { ApiResult, MeProfile } from '@/types/api'

export async function fetchMyProfile(): Promise<MeProfile> {
  const res = await http.get<ApiResult<MeProfile>>('/members/me')
  return res.data.data
}
