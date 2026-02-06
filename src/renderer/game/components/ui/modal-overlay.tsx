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
        'absolute inset-0 bg-black/60 flex items-center justify-center z-30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
