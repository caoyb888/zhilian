import axios, { type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const http = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function drainQueue(token: string) {
  pendingQueue.forEach((p) => p.resolve(token))
  pendingQueue = []
}

function rejectQueue(err: unknown) {
  pendingQueue.forEach((p) => p.reject(err))
  pendingQueue = []
}

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original: AxiosRequestConfig & { _retry?: boolean } = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    const { refreshToken, updateTokens, clearAuth } = useAuthStore.getState()
    if (!refreshToken) {
      clearAuth()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers = { ...original.headers, Authorization: `Bearer ${token}` }
            original._retry = true
            resolve(http(original))
          },
          reject,
        })
      })
    }

    isRefreshing = true
    original._retry = true

    try {
      const res = await axios.post<{
        code: number
        data: { accessToken: string; refreshToken: string }
      }>('/api/v1/auth/refresh-token', { refreshToken })

      const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data
      updateTokens(newAccess, newRefresh)
      drainQueue(newAccess)
      original.headers = { ...original.headers, Authorization: `Bearer ${newAccess}` }
      return http(original)
    } catch (refreshErr) {
      rejectQueue(refreshErr)
      clearAuth()
      window.location.href = '/login'
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)

export default http
