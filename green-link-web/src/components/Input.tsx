import { clsx } from 'clsx'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Icon } from './Icon'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  error?: boolean
  inputClassName?: string
  suffix?: React.ReactNode
}

export function Input({ error, inputClassName, suffix, type, ...rest }: InputProps) {
  const [showPwd, setShowPwd] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="relative flex items-center">
      <input
        type={isPassword ? (showPwd ? 'text' : 'password') : type}
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm text-theme-text-main placeholder-stone-400 bg-theme-surface',
          'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent/20',
          error
            ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-400/20'
            : 'border-stone-200 hover:border-stone-300 focus:border-theme-accent',
          (isPassword || suffix) && 'pr-10',
          inputClassName
        )}
        {...rest}
      />
      {isPassword && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPwd((v) => !v)}
          className="absolute right-3 text-stone-400 hover:text-stone-600 transition-colors"
          aria-label={showPwd ? '隐藏密码' : '显示密码'}
        >
          <Icon icon={showPwd ? EyeOff : Eye} size={18} />
        </button>
      )}
      {!isPassword && suffix && (
        <div className="absolute right-3">{suffix}</div>
      )}
    </div>
  )
}
