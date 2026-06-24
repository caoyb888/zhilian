import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import {
  loginByPassword,
  loginBySms,
  logout,
  registerMember,
  fetchCaptcha,
  sendSmsCode,
  type LoginParams,
  type SmsLoginParams,
  type RegisterParams,
} from '@/services/authService'
import { fetchMyProfile } from '@/services/memberService'

async function hydratePermissions(
  setPermissions: (p: string[]) => void
): Promise<void> {
  try {
    const profile = await fetchMyProfile()
    setPermissions(profile.permissions ?? [])
  } catch {
    setPermissions([])
  }
}

export function usePasswordLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const setPermissions = useAuthStore((s) => s.setPermissions)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: LoginParams) => loginByPassword(params),
    onSuccess: async (data) => {
      // 切换用户：清空上个用户残留的 React Query 缓存（#12）
      queryClient.clear()
      setAuth(data)
      await hydratePermissions(setPermissions)
    },
  })
}

export function useSmsLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const setPermissions = useAuthStore((s) => s.setPermissions)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: SmsLoginParams) => loginBySms(params),
    onSuccess: async (data) => {
      queryClient.clear()
      setAuth(data)
      await hydratePermissions(setPermissions)
    },
  })
}

export function useLogout() {
  const { refreshToken, clearAuth } = useAuthStore()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => logout(refreshToken ?? ''),
    onSettled: () => {
      clearAuth()
      // 退出登录：清空缓存，避免下个用户看到上个用户的数据（#12）
      queryClient.clear()
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (params: RegisterParams) => registerMember(params),
  })
}

export function useFetchCaptcha() {
  return useMutation({
    mutationFn: fetchCaptcha,
  })
}

export function useSendSmsCode() {
  return useMutation({
    mutationFn: ({ phone, scene }: { phone: string; scene: string }) =>
      sendSmsCode(phone, scene),
  })
}
