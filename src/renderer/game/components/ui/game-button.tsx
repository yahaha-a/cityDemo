import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'renderer/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

const gameButtonVariants = cva(
  'rounded transition-colors select-none cursor-pointer',
  {
    variants: {
      variant: {
        tool: 'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
        panel:
          'w-full text-left px-2 py-1.5 text-xs mb-1 border border-transparent',
        action: 'px-4 py-2 text-sm',
        speed: 'px-2 py-1 text-xs font-mono',
        menu: 'w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-800',
        toggle: 'px-3 py-1.5 text-xs',
      },
      intent: {
        default: 'bg-gray-800 text-gray-300 hover:bg-gray-700',
        active: 'bg-blue-600 text-white',
        primary: 'bg-blue-600 text-white hover:bg-blue-500',
        danger: 'bg-red-600/80 text-white hover:bg-red-500',
        secondary: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
        purple: 'bg-purple-600 text-white',
        ghost: 'bg-transparent text-gray-300 hover:bg-gray-800',
      },
      state: {
        default: '',
        disabled: 'bg-gray-800/50 text-gray-600 cursor-not-allowed opacity-60',
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
