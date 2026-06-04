import { clsx } from 'clsx'
import { Spinner } from './Spinner'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

const variantMap = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-500 disabled:bg-brand-300',
  secondary:
    'bg-white text-brand-600 border border-brand-500 hover:bg-brand-50 focus-visible:ring-brand-500 disabled:opacity-50',
  ghost:
    'text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400 disabled:opacity-50',
  danger:
    'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 disabled:bg-red-300',
}

const sizeMap = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        variantMap[variant],
        sizeMap[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled ?? loading}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
