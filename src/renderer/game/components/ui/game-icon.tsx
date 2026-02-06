import type { LucideProps } from 'lucide-react'
import { cn } from 'renderer/lib/utils'

export function GameIcon({
  icon: Icon,
  className,
  size = 18,
  ...props
}: LucideProps & { icon: React.ComponentType<LucideProps> }) {
  return (
    <Icon
      className={cn('text-[var(--game-text)]', className)}
      size={size}
      strokeWidth={2.5}
      {...props}
    />
  )
}
