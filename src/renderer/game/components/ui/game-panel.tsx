import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'renderer/lib/utils'
import type { HTMLAttributes } from 'react'

const gamePanelVariants = cva(
  'bg-gray-900/90 rounded-lg border border-gray-700 select-none',
  {
    variants: {
      size: {
        sm: 'p-2',
        md: 'p-3',
        lg: 'p-4',
      },
      position: {
        'top-left': 'absolute top-4 left-4',
        'top-right': 'absolute top-4 right-4',
        'bottom-left': 'absolute bottom-4 left-4',
        'bottom-right': 'absolute bottom-4 right-4',
        'bottom-center': 'absolute bottom-16 left-1/2 -translate-x-1/2',
        static: '',
      },
    },
    defaultVariants: {
      size: 'md',
      position: 'static',
    },
  }
)

export type GamePanelProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof gamePanelVariants>

export function GamePanel({
  className,
  size,
  position,
  ...props
}: GamePanelProps) {
  return (
    <div
      className={cn(gamePanelVariants({ size, position }), className)}
      {...props}
    />
  )
}
