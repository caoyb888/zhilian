import { useMutation } from '@tanstack/react-query'
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

export function usePasswordLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: (params: LoginParams) => loginByPassword(params),
    onSuccess: (data) => setAuth(data),
  })
}

export function useSmsLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: (params: SmsLoginParams) => loginBySms(params),
    onSuccess: (data) => setAuth(data),
  })
}

export function useLogout() {
  const { refreshToken, clearAuth } = useAuthStore()
  return useMutation({
    mutationFn: () => logout(refreshToken ?? ''),
    onSettled: () => clearAuth(),
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
