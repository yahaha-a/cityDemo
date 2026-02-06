import { memo } from 'react'
import { POLICY_TEMPLATES, MAX_ACTIVE_POLICIES } from '../constants'
import { useEngine } from '../context/game-engine-context'
import { usePolicies } from '../hooks/use-game-selector'
import { GamePanel, GamePanelHeader } from './ui/game-panel'
import { ScrollText } from 'lucide-react'
import { cn } from 'renderer/lib/utils'

export const PolicyPanel = memo(function PolicyPanel() {
  const engine = useEngine()
  const policies = usePolicies()
  const activeCount = policies.activePolicies.length

  const categories = [...new Set(POLICY_TEMPLATES.map(t => t.category))]

  return (
    <GamePanel
      className="relative min-w-[300px] max-h-[80vh] overflow-y-auto"
      size="md"
    >
      <GamePanelHeader>
        <div className="flex items-center gap-1.5">
          <ScrollText className="text-[var(--game-blue)]" size={16} />
          <span>政策管理</span>
        </div>
        <span className="text-xs text-[var(--game-text-muted)]">
          {activeCount}/{MAX_ACTIVE_POLICIES}
        </span>
      </GamePanelHeader>

      {categories.map(cat => (
        <div className="mb-2" key={cat}>
          <div className="text-xs text-[var(--game-text-muted)] mb-1 font-[family-name:var(--font-heading)]">
            {cat}
          </div>
          {POLICY_TEMPLATES.filter(t => t.category === cat).map(template => {
            const isActive = policies.activePolicies.includes(template.id)
            const { canToggle, reason } = engine.policySystem.canTogglePolicy(
              template.id
            )
            const cooldown = policies.cooldowns[template.id] ?? 0

            return (
              <button
                className={cn(
                  'w-full text-left px-2 py-1.5 rounded-[var(--game-radius-sm)] text-xs mb-1 transition-all border',
                  isActive
                    ? 'bg-[var(--game-blue)]/15 text-[var(--game-text)] border-[var(--game-blue)] shadow-[var(--game-shadow-inset)]'
                    : canToggle
                      ? 'bg-[var(--game-parchment-light)] text-[var(--game-text)] hover:bg-[var(--game-parchment-dark)] border-[var(--game-wood)]/30 cursor-pointer'
                      : 'bg-[var(--game-parchment-dark)]/50 text-[var(--game-text-muted)] border-dashed border-[var(--game-wood)]/20 cursor-not-allowed opacity-60'
                )}
                disabled={!canToggle && !isActive}
                key={template.id}
                onClick={() => engine.policySystem.togglePolicy(template.id)}
                title={reason}
                type="button"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{template.name}</span>
                  {isActive && (
                    <span className="game-seal bg-[var(--game-blue)] text-white">
                      ON
                    </span>
                  )}
                  {cooldown > 0 && (
                    <span className="text-[10px] text-[var(--game-text-muted)]">
                      {cooldown}d
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[var(--game-text-muted)] mt-0.5">
                  {template.effects
                    .map(e => {
                      const sign =
                        e.value > 0 && !e.type.includes('multiplier') ? '+' : ''
                      const val = e.type.includes('multiplier')
                        ? `${e.value > 1 ? '+' : ''}${Math.round((e.value - 1) * 100)}%`
                        : `${sign}${e.value}`
                      return `${getEffectLabel(e.type)} ${val}`
                    })
                    .join(', ')}
                </div>
                {!canToggle && !isActive && reason && (
                  <div className="text-[10px] text-[var(--game-red)] mt-0.5">
                    {reason}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      ))}
    </GamePanel>
  )
})

function getEffectLabel(type: string): string {
  const labels: Record<string, string> = {
    income_multiplier: '收入',
    satisfaction: '满意度',
    growth_multiplier: '增长',
    expense_multiplier: '支出',
    industrial_multiplier: '工业',
    commercial_multiplier: '商业',
    capacity_multiplier: '容量',
    research_multiplier: '研究',
    road_maintenance_multiplier: '道路维护',
    build_cost_multiplier: '建造成本',
    crisis_frequency_multiplier: '危机频率',
  }
  return labels[type] ?? type
}
