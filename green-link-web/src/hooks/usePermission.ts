import { useAuthStore } from '@/stores/authStore'

/**
 * 返回当前用户是否拥有指定权限码。
 * SUPER_ADMIN 角色绕过所有权限校验，始终返回 true。
 */
export function usePermission(code: string): boolean {
  const permissions = useAuthStore((s) => s.permissions)
  const roles = useAuthStore((s) => s.accountInfo?.roles ?? [])
  return roles.includes('SUPER_ADMIN') || permissions.includes(code)
}

export function useHasAnyPermission(codes: string[]): boolean {
  const permissions = useAuthStore((s) => s.permissions)
  const roles = useAuthStore((s) => s.accountInfo?.roles ?? [])
  return roles.includes('SUPER_ADMIN') || codes.some((c) => permissions.includes(c))
}
