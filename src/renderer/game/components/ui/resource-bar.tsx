import { ProgressBar } from './progress-bar'
import { ratioBarColor } from './theme'

export function ResourceBar({
  label,
  supply,
  demand,
  ratio,
}: {
  label: string
  supply: number
  demand: number
  ratio: number
}) {
  const pct = Math.round(ratio * 100)

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs text-[var(--game-text)]">
        <span>{label}</span>
        <span>
          {supply.toFixed(0)}/{demand.toFixed(0)} ({pct}%)
        </span>
      </div>
      <ProgressBar barColor={ratioBarColor(ratio)} percent={pct} />
    </div>
  )
}
