import { type LucideIcon, type LucideProps } from 'lucide-react'

interface IconProps extends Omit<LucideProps, 'ref'> {
  icon: LucideIcon
}

export function Icon({ icon: LucideComponent, className, size = 20, strokeWidth = 1.5, ...rest }: IconProps) {
  return (
    <LucideComponent
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
      {...rest}
    />
  )
}
