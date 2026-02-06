import { cn } from 'renderer/lib/utils'
import type { HTMLAttributes } from 'react'

export function ModalOverlay({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'absolute inset-0 bg-[var(--game-overlay)] backdrop-blur-[2px] flex items-center justify-center z-30 animate-[fadeIn_0.15s_ease-out]',
        className
      )}
      {...props}
    >
      <div className="animate-[scaleIn_0.2s_ease-out]">{children}</div>
    </div>
  )
}
