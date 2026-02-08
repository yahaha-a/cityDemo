import { DemandLevel } from 'shared/types'
import type { DemandIndicators } from 'shared/types'
import { AccordionSection } from '../ui/accordion-section'
import { DEMAND_TEXT_COLORS } from '../ui/theme'

const DEMAND_LABELS: Record<DemandLevel, string> = {
  [DemandLevel.Low]: '充足',
  [DemandLevel.Balanced]: '平衡',
  [DemandLevel.High]: '紧缺',
  [DemandLevel.Critical]: '严重不足',
}

export function DemandSection({
  demandIndicators,
}: {
  demandIndicators: DemandIndicators
}) {
  return (
    <AccordionSection title="建设需求">
      <div className="text-xs text-[var(--game-text)] space-y-0.5">
        <div className="flex justify-between">
          <span>住宅</span>
          <span className={DEMAND_TEXT_COLORS[demandIndicators.residential]}>
            {DEMAND_LABELS[demandIndicators.residential]}
          </span>
        </div>
        <div className="flex justify-between">
          <span>商业</span>
          <span className={DEMAND_TEXT_COLORS[demandIndicators.commercial]}>
            {DEMAND_LABELS[demandIndicators.commercial]}
          </span>
        </div>
        <div className="flex justify-between">
          <span>工业</span>
          <span className={DEMAND_TEXT_COLORS[demandIndicators.industrial]}>
            {DEMAND_LABELS[demandIndicators.industrial]}
          </span>
        </div>
      </div>
    </AccordionSection>
  )
}
