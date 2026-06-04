import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ADMIN_ROLES } from '@/types/api'
import type { ReactNode } from 'react'

interface RequireAuthProps {
  children: ReactNode
  adminOnly?: boolean
}

export function RequireAuth({ children, adminOnly = false }: RequireAuthProps) {
  const { accessToken, accountInfo } = useAuthStore()
  const location = useLocation()

  if (!accessToken || !accountInfo) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminOnly && !accountInfo.roles.some((r) => ADMIN_ROLES.includes(r))) {
    return <Navigate to="/supply" replace />
  }

  return <>{children}</>
}
