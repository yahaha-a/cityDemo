import { SPECIALIZATION_TEMPLATES } from '../constants'
import type { SpecializationEffect } from 'shared/game-types'
import { useEngine } from '../context/game-engine-context'
import { useSpecialization } from '../hooks/use-game-selector'
import { ModalOverlay } from './ui/modal-overlay'
import { cn } from 'renderer/lib/utils'

export function SpecializationPanel() {
  const engine = useEngine()
  const specialization = useSpecialization()

  // 如果已经选择了特色，显示当前特色
  if (specialization.chosen) {
    const template = SPECIALIZATION_TEMPLATES.find(
      t => t.id === specialization.chosen
    )
    if (!template) return null

    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 game-parchment-bg game-wood-frame rounded-[var(--game-radius-lg)] p-4 max-w-[300px] pointer-events-none z-25">
        <div className="text-sm text-[var(--game-gold)] font-[family-name:var(--font-heading)]">
          城市特色
        </div>
        <div className="text-lg font-bold font-[family-name:var(--font-heading)] text-[var(--game-text-heading)]">
          {template.name}
        </div>
        <div className="text-xs text-[var(--game-text-muted)] mt-1">
          {template.description}
        </div>
      </div>
    )
  }

  // 如果没有可用特色，不显示
  if (specialization.available.length === 0) return null

  return (
    <ModalOverlay className="z-40">
      <div className="bg-[var(--game-parchment-dark)] game-wood-frame rounded-[var(--game-radius-lg)] p-5 max-w-[520px] w-full mx-4 border-[4px]">
        <h2 className="text-lg font-bold font-[family-name:var(--font-heading)] text-[var(--game-gold)] mb-1">
          选择城市特色
        </h2>
        <p className="text-xs text-[var(--game-text-muted)] mb-4">
          这是一次性不可逆的选择，将永久决定你的城市发展方向。
        </p>

        <div className="grid grid-cols-2 gap-3">
          {specialization.available.map((specId, i) => {
            const template = SPECIALIZATION_TEMPLATES.find(t => t.id === specId)
            if (!template) return null

            // 轻微倾斜 + 图钉效果
            const rotation = i % 2 === 0 ? '-0.5deg' : '0.5deg'

            return (
              <button
                className={cn(
                  'relative text-left p-3 rounded-[var(--game-radius-md)] game-parchment-bg border border-[var(--game-wood)]/40',
                  'hover:border-[var(--game-gold)] hover:shadow-[var(--game-shadow-panel)] hover:rotate-0 hover:-translate-y-1',
                  'transition-all cursor-pointer'
                )}
                key={specId}
                onClick={() =>
                  engine.specializationSystem.chooseSpecialization(specId)
                }
                style={{ transform: `rotate(${rotation})` }}
                type="button"
              >
                {/* 图钉装饰 */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--game-red)] shadow-[0_1px_2px_oklch(0.3_0.05_55/0.4)] border border-[var(--game-red-light)]" />

                <div className="text-sm font-bold font-[family-name:var(--font-heading)] text-[var(--game-text-heading)] mb-1 mt-1">
                  {template.name}
                </div>
                <div className="text-[10px] text-[var(--game-text-muted)] space-y-0.5">
                  {template.effects.map(e => (
                    <div key={e.type}>{formatSpecEffect(e)}</div>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </ModalOverlay>
  )
}

function formatSpecEffect(effect: SpecializationEffect): string {
  const labels: Record<string, string> = {
    industrial_multiplier: '工业产出',
    commercial_multiplier: '商业产出',
    satisfaction: '满意度',
    capacity_multiplier: '人口容量',
    income_multiplier: '收入',
    build_cost_multiplier: '建造成本',
    research_multiplier: '研究速度',
    all_production_multiplier: '全产出',
    all_cost_multiplier: '全成本',
  }
  const label = labels[effect.type] ?? effect.type

  if (effect.type.includes('multiplier')) {
    const pct = Math.round((effect.value - 1) * 100)
    return `${label} ${pct > 0 ? '+' : ''}${pct}%`
  }
  return `${label} ${effect.value > 0 ? '+' : ''}${effect.value}`
}
