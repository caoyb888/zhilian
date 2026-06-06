import { type LucideIcon } from 'lucide-react'
import { Icon } from '../Icon'

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon,
  title = '暂无数据',
  description = '当前列表为空，您可以稍后查看或尝试其他条件',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
          <Icon icon={icon} size={24} />
        </div>
      )}
      <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
      <p className="mt-1 max-w-xs text-xs text-stone-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
