import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'renderer/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

const gameButtonVariants = cva(
  'rounded-[var(--game-radius-md)] transition-all select-none cursor-pointer font-[family-name:var(--font-body)] border border-[var(--game-wood)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--game-gold)]',
  {
    variants: {
      variant: {
        tool: 'flex items-center gap-2 px-3 py-2 text-sm',
        panel: 'w-full text-left px-2 py-1.5 text-xs mb-1',
        action: 'px-4 py-2 text-sm',
        speed: 'px-2 py-1 text-xs font-mono',
        menu: 'w-full px-4 py-2.5 text-left text-sm text-[var(--game-text)] hover:bg-[var(--game-parchment-dark)]',
        toggle: 'px-3 py-1.5 text-xs',
        icon: 'w-10 h-10 flex items-center justify-center rounded-[var(--game-radius-md)] p-0',
      },
      intent: {
        default:
          'bg-[var(--game-parchment-light)] text-[var(--game-text)] hover:bg-[var(--game-parchment-dark)] shadow-[var(--game-shadow-button)] active:translate-y-[1px] active:shadow-none',
        active:
          'bg-[var(--game-gold)] text-[var(--game-text-heading)] border-[var(--game-wood-dark)] shadow-[var(--game-shadow-inset)]',
        primary:
          'bg-[var(--game-green)] text-white border-[var(--game-green)] hover:brightness-110 shadow-[var(--game-shadow-button)] active:translate-y-[1px] active:shadow-none',
        danger:
          'bg-[var(--game-red)] text-white border-[var(--game-red)] hover:brightness-110 shadow-[var(--game-shadow-button)] active:translate-y-[1px] active:shadow-none',
        secondary:
          'bg-[var(--game-parchment-dark)] text-[var(--game-text)] hover:bg-[var(--game-wood-light)] hover:text-white shadow-[var(--game-shadow-button)] active:translate-y-[1px] active:shadow-none',
        purple:
          'bg-[var(--game-purple)] text-white border-[var(--game-purple)] hover:brightness-110 shadow-[var(--game-shadow-button)] active:translate-y-[1px] active:shadow-none',
        ghost:
          'bg-transparent text-[var(--game-text)] border-transparent hover:bg-[var(--game-parchment-dark)] shadow-none',
      },
      state: {
        default: '',
        disabled:
          'opacity-50 cursor-not-allowed shadow-none pointer-events-none',
      },
    },
    defaultVariants: {
      variant: 'action',
      intent: 'default',
      state: 'default',
    },
  }
)

export type GameButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof gameButtonVariants>

export function GameButton({
  className,
  variant,
  intent,
  state,
  disabled,
  ...props
}: GameButtonProps) {
  return (
    <button
      className={cn(
        gameButtonVariants({
          variant,
          intent,
          state: disabled ? 'disabled' : state,
        }),
        className
      )}
      disabled={disabled}
      type="button"
      {...props}
    />
  )
}
