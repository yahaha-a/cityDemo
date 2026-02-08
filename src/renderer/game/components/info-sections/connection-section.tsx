import { AccordionSection } from '../ui/accordion-section'

export function ConnectionSection({
  connectionStats,
}: {
  connectionStats: { total: number; connected: number; disconnected: number }
}) {
  if (connectionStats.total <= 0) return null

  return (
    <AccordionSection title="道路连接">
      <div className="text-xs text-[var(--game-text)] space-y-0.5">
        <div className="flex justify-between">
          <span className="text-[var(--game-green)]">已连接</span>
          <span>{connectionStats.connected}</span>
        </div>
        {connectionStats.disconnected > 0 && (
          <div className="flex justify-between">
            <span className="text-[var(--game-red)]">未连接</span>
            <span>{connectionStats.disconnected}</span>
          </div>
        )}
      </div>
    </AccordionSection>
  )
}
