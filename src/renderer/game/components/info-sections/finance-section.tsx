import { Coins } from 'lucide-react'
import { cn } from 'renderer/lib/utils'
import { AccordionSection } from '../ui/accordion-section'

export function FinanceSection({
  money,
  lastDayRevenue,
}: {
  money: number
  lastDayRevenue: number
}) {
  return (
    <AccordionSection
      defaultOpen
      icon={<Coins className="text-[var(--game-gold)]" size={14} />}
      title="城市财务"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold font-[family-name:var(--font-heading)] text-[var(--game-green)]">
          ${money.toLocaleString()}
        </span>
        {lastDayRevenue !== 0 && (
          <span
            className={cn(
              'text-xs font-bold',
              lastDayRevenue > 0
                ? 'text-[var(--game-green)]'
                : 'text-[var(--game-red)]'
            )}
          >
            {lastDayRevenue > 0 ? '+' : ''}
            {lastDayRevenue}/日
          </span>
        )}
      </div>
    </AccordionSection>
  )
}
