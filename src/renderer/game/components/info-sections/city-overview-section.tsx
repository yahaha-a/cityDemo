import type { BuildingCategory } from 'shared/types/building-defs'
import { AccordionSection } from '../ui/accordion-section'
import { GamePanelDivider } from '../ui/game-panel'

const CATEGORY_LABELS: Record<BuildingCategory, string> = {
  residential: '住宅',
  commercial: '商业',
  industrial: '工业',
  service: '服务',
}

export function CityOverviewSection({
  roadCount,
  categoryCounts,
  usage,
}: {
  roadCount: number
  categoryCounts: Record<BuildingCategory, number>
  usage: number
}) {
  return (
    <AccordionSection title="城市概况">
      <div className="text-xs text-[var(--game-text)] space-y-0.5">
        <div className="flex justify-between">
          <span>道路</span>
          <span>{roadCount}</span>
        </div>
        {(
          [
            'residential',
            'commercial',
            'industrial',
            'service',
          ] as BuildingCategory[]
        ).map(cat => (
          <div className="flex justify-between" key={cat}>
            <span>{CATEGORY_LABELS[cat]}</span>
            <span>{categoryCounts[cat]}</span>
          </div>
        ))}
        <GamePanelDivider className="my-1 opacity-30" />
        <div className="flex justify-between">
          <span>土地利用</span>
          <span>{usage}%</span>
        </div>
      </div>
    </AccordionSection>
  )
}
