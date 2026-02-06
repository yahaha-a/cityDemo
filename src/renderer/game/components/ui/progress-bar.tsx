import { cn } from 'renderer/lib/utils'

export function ProgressBar({
  percent,
  barColor = 'bg-blue-400',
  className,
}: {
  percent: number
  barColor?: string
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div
      className={cn(
        'w-full h-1.5 bg-gray-700 rounded-full overflow-hidden',
        className
      )}
    >
      <div
        className={cn('h-full rounded-full', barColor)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
