import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { cn } from '@/lib/utils'

interface IconProps {
  icon: IconSvgElement
  className?: string
  size?: number
  strokeWidth?: number
}

export function Icon({ icon, className, size, strokeWidth = 1.5 }: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      className={cn(className)}
    />
  )
}
