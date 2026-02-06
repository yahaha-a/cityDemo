import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'renderer/lib/utils'
import type { HTMLAttributes } from 'react'
import { X } from 'lucide-react'

const gamePanelVariants = cva(
  'game-parchment-bg game-wood-frame rounded-[var(--game-radius-lg)] select-none text-[var(--game-text)] font-[family-name:var(--font-body)]',
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
      elevation: {
        flat: '',
        raised: 'shadow-[0_4px_16px_oklch(0.30_0.05_55/0.2)]',
      },
    },
    defaultVariants: {
      size: 'md',
      position: 'static',
      elevation: 'flat',
    },
  }
)

export type GamePanelProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof gamePanelVariants>

export function GamePanel({
  className,
  size,
  position,
  elevation,
  ...props
}: GamePanelProps) {
  return (
    <div
      className={cn(
        gamePanelVariants({ size, position, elevation }),
        className
      )}
      {...props}
    />
  )
}

export function GamePanelHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'pb-2 mb-2 border-b-2 border-dashed border-[var(--game-wood-light)] text-sm font-[family-name:var(--font-heading)] text-[var(--game-text-heading)] flex items-center justify-between',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function GamePanelDivider({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'my-2 h-px bg-gradient-to-r from-transparent via-[var(--game-wood-light)] to-transparent opacity-50',
        className
      )}
      {...props}
    />
  )
}

export function PanelCloseButton({
  onClick,
  className,
}: {
  onClick: () => void
  className?: string
}) {
  return (
    <button
      className={cn(
        'absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center',
        'bg-[var(--game-parchment-dark)] border border-[var(--game-wood)] text-[var(--game-text-muted)]',
        'hover:bg-[var(--game-red-light)] hover:text-white hover:border-[var(--game-red)]',
        'transition-colors cursor-pointer',
        className
      )}
      onClick={onClick}
      type="button"
    >
      <X size={12} strokeWidth={2.5} />
    </button>
  )
}
