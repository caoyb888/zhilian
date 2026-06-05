import { Navigate, useLocation } from 'react-router-dom'
import { usePermission } from '@/hooks/usePermission'
import type { ReactNode } from 'react'

interface PrivateRouteProps {
  permission: string
  children: ReactNode
}

/**
 * 按钮/路由级权限守卫。
 * 无对应 permission 时重定向到 /403，不白屏。
 */
export function PrivateRoute({ permission, children }: PrivateRouteProps) {
  const hasPermission = usePermission(permission)
  const location = useLocation()

  if (!hasPermission) {
    return <Navigate to="/403" state={{ from: location }} replace />
  }

  return <>{children}</>
}
