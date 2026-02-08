import { BarChart3 } from 'lucide-react'
import type { BuildingEffectState } from 'shared/types/building-effects'
import { AccordionSection } from '../ui/accordion-section'
import { ResourceBar } from '../ui/resource-bar'

export function ResourceMarketSection({
  resources,
}: {
  resources: BuildingEffectState['resources']
}) {
  return (
    <AccordionSection
      icon={<BarChart3 className="text-[var(--game-text-muted)]" size={14} />}
      title="资源市场"
    >
      <div className="space-y-1.5">
        <ResourceBar
          demand={resources.laborDemand}
          label="劳动力"
          ratio={resources.laborFulfillment}
          supply={resources.laborSupply}
        />
        <ResourceBar
          demand={resources.goodsDemand}
          label="货物"
          ratio={resources.goodsFulfillment}
          supply={resources.goodsSupply}
        />
        <ResourceBar
          demand={resources.servicesDemand}
          label="服务"
          ratio={resources.servicesFulfillment}
          supply={resources.servicesSupply}
        />
      </div>
    </AccordionSection>
  )
}
