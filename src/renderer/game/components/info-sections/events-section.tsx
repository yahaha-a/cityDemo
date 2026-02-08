import type { GameEvent } from 'shared/types'
import { AccordionSection } from '../ui/accordion-section'

export function EventsSection({ events }: { events: GameEvent[] }) {
  if (events.length === 0) return null

  return (
    <AccordionSection defaultOpen title="当前事件">
      {events.map(event => (
        <div className="text-xs text-[var(--game-blue)] mb-1" key={event.id}>
          <div className="flex justify-between">
            <span className="font-medium">{event.name}</span>
            <span className="text-[var(--game-text-muted)]">
              {event.remainingDays}天
            </span>
          </div>
          <div className="text-[10px] text-[var(--game-text-muted)]">
            {event.description}
          </div>
        </div>
      ))}
    </AccordionSection>
  )
}
