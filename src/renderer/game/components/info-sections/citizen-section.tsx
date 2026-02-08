import { Users, SmilePlus } from 'lucide-react'
import { AccordionSection } from '../ui/accordion-section'
import { ProgressBar } from '../ui/progress-bar'
import { satisfactionColor, satisfactionBarColor } from '../ui/theme'

export function CitizenSection({
  satisfaction,
  population,
  populationCapacity,
}: {
  satisfaction: number
  population: number
  populationCapacity: number
}) {
  const popTrend =
    satisfaction >= 50
      ? population < populationCapacity
        ? '+'
        : '='
      : population > 0
        ? '-'
        : '='

  return (
    <AccordionSection
      defaultOpen
      icon={<Users className="text-[var(--game-text-muted)]" size={14} />}
      title="市民状态"
    >
      <div className="text-xs text-[var(--game-text)] space-y-1">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <SmilePlus size={12} />
            满意度
          </span>
          <span className={satisfactionColor(satisfaction)}>
            {Math.round(satisfaction)}%
          </span>
        </div>
        <ProgressBar
          barColor={satisfactionBarColor(satisfaction)}
          percent={Math.round(satisfaction)}
        />
        <div className="flex justify-between">
          <span>人口</span>
          <span>
            {population}/{populationCapacity}{' '}
            <span
              className={
                popTrend === '+'
                  ? 'text-[var(--game-green)]'
                  : popTrend === '-'
                    ? 'text-[var(--game-red)]'
                    : 'text-[var(--game-text-muted)]'
              }
            >
              {popTrend}
            </span>
          </span>
        </div>
      </div>
    </AccordionSection>
  )
}
