import http from './http'
import axios from 'axios'
import type { ApiResult, CaptchaData, LoginData, SmsCodeData } from '@/types/api'

export interface LoginParams {
  username: string
  password: string
  captchaToken?: string
  captchaCode?: string
}

export interface SmsLoginParams {
  phone: string
  smsCode: string
}

export interface RegisterParams {
  name: string
  shortName?: string
  industry: string
  province?: string
  city?: string
  username: string
  password: string
  phone: string
  smsCode: string
  licenseUrl?: string
  tagIds?: number[]
}

export interface RegisterResult {
  memberId: number
  memberStatus: number
  accountId: number
}

export async function loginByPassword(params: LoginParams): Promise<LoginData> {
  const res = await http.post<ApiResult<LoginData>>('/auth/login', params)
  return res.data.data
}

export async function loginBySms(params: SmsLoginParams): Promise<LoginData> {
  const res = await http.post<ApiResult<LoginData>>('/auth/sms-login', params)
  return res.data.data
}

export async function logout(refreshToken: string): Promise<void> {
  await http.post('/auth/logout', { refreshToken }).catch(() => {})
}

export async function fetchCaptcha(): Promise<CaptchaData> {
  const res = await http.get<ApiResult<CaptchaData>>('/auth/captcha')
  return res.data.data
}

export async function sendSmsCode(phone: string, scene: string): Promise<SmsCodeData> {
  const res = await http.post<ApiResult<SmsCodeData>>('/auth/sms-code', { phone, scene })
  return res.data.data
}

export async function registerMember(params: RegisterParams): Promise<RegisterResult> {
  const res = await http.post<ApiResult<RegisterResult>>('/members/register', params)
  return res.data.data
}

export function extractApiError(err: unknown): { code: number; msg: string } {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { code?: number; msg?: string }
    return { code: d.code ?? -1, msg: d.msg ?? '请求失败' }
  }
  return { code: -1, msg: '网络异常，请检查连接' }
}
