import http from './http'
import type { ApiResult, PageData } from '@/types/api'

export interface Activity {
  id: number
  title: string
  coverUrl: string | null
  location: string | null
  startTime: string | null
  endTime: string | null
  regDeadline: string | null
  maxCapacity: number | null
  regCount: number
  status: number
  createdAt: string
}

export interface Signup {
  id: number
  activityId: number
  accountId: number
  memberId: number
  remark: string | null
  status: number
  createdAt: string
}

export interface CreateActivityRequest {
  title: string
  content?: string
  coverUrl?: string
  location?: string
  startTime?: string
  endTime?: string
  regDeadline?: string
  maxCapacity?: number
  status?: number
}

export interface UpdateActivityRequest {
  title: string
  content?: string
  coverUrl?: string
  location?: string
  startTime?: string
  endTime?: string
  regDeadline?: string
  maxCapacity?: number
  status?: number
}

export interface ActivityPageParams {
  status?: number
  page?: number
  size?: number
}

export const ACTIVITY_STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '筹备中', color: 'bg-gray-100 text-gray-600' },
  2: { label: '报名中', color: 'bg-brand-100 text-brand-700' },
  3: { label: '已结束', color: 'bg-gray-100 text-gray-500' },
}

export const SIGNUP_STATUS_MAP: Record<number, string> = {
  1: '已报名',
  2: '已签到',
  3: '已取消',
}

export async function fetchActivities(params: ActivityPageParams = {}): Promise<PageData<Activity>> {
  const res = await http.get<ApiResult<PageData<Activity>>>('/portal/activities', { params })
  return res.data.data
}

export async function fetchActivityDetail(id: number): Promise<Activity> {
  const res = await http.get<ApiResult<Activity>>(`/portal/activities/${id}`)
  return res.data.data
}

export async function createActivity(data: CreateActivityRequest): Promise<Activity> {
  const res = await http.post<ApiResult<Activity>>('/portal/activities', data)
  return res.data.data
}

export async function updateActivity(id: number, data: UpdateActivityRequest): Promise<Activity> {
  const res = await http.put<ApiResult<Activity>>(`/portal/activities/${id}`, data)
  return res.data.data
}

export async function deleteActivity(id: number): Promise<void> {
  await http.delete<ApiResult<null>>(`/portal/activities/${id}`)
}

export async function updateActivityStatus(id: number, status: number): Promise<void> {
  await http.patch<ApiResult<null>>(`/portal/activities/${id}/status`, { status })
}

export async function fetchSignups(activityId: number, params?: { page?: number; size?: number }): Promise<PageData<Signup>> {
  const res = await http.get<ApiResult<PageData<Signup>>>(`/portal/activities/${activityId}/signups`, { params })
  return res.data.data
}

export async function checkinSignup(activityId: number, signupId: number): Promise<void> {
  await http.patch<ApiResult<null>>(`/portal/activities/${activityId}/signups/${signupId}/checkin`)
}
