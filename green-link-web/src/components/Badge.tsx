import { clsx } from 'clsx'

export type BadgeVariant =
  | 'news'
  | 'notice'
  | 'policy'
  | 'activity'
  | 'success'
  | 'error'
  | 'warning'
  | 'vip'
  | 'default'

const variantMap: Record<BadgeVariant, string> = {
  news: 'bg-blue-50 text-blue-700 border-blue-200',
  notice: 'bg-amber-50 text-amber-700 border-amber-200',
  policy: 'bg-purple-50 text-purple-700 border-purple-200',
  activity: 'bg-teal-50 text-teal-700 border-teal-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-orange-50 text-orange-700 border-orange-200',
  vip: 'bg-amber-50 text-amber-700 border-amber-300',
  default: 'bg-gray-50 text-gray-600 border-gray-200',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide border',
        variantMap[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
