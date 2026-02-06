import { cn } from 'renderer/lib/utils'

export function ProgressBar({
  percent,
  barColor = 'bg-[var(--game-blue)]',
  className,
  label,
}: {
  percent: number
  barColor?: string
  className?: string
  label?: string
}) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className={cn('w-full space-y-0.5', className)}>
      {label && (
        <div className="text-[10px] text-[var(--game-text-muted)]">{label}</div>
      )}
      <div className="w-full h-1.5 bg-[var(--game-parchment-dark)] rounded-full overflow-hidden border border-[var(--game-wood)]/30 shadow-[var(--game-shadow-inset)]">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-300',
            barColor
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
