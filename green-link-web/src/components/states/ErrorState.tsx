import { AlertTriangle, type LucideIcon } from 'lucide-react'
import { Icon } from '../Icon'

interface ErrorStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: React.ReactNode
}

export function ErrorState({
  icon = AlertTriangle,
  title = '加载失败',
  description = '数据加载出现异常，请检查网络或稍后重试',
  action,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-400">
        <Icon icon={icon} size={24} />
      </div>
      <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
      <p className="mt-1 max-w-xs text-xs text-stone-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
