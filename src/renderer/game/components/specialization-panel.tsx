import { SPECIALIZATION_TEMPLATES } from '../constants'
import type { SpecializationEffect } from 'shared/game-types'
import { useEngine } from '../context/game-engine-context'
import { useSpecialization } from '../hooks/use-game-selector'
import { ModalOverlay } from './ui/modal-overlay'

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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900/95 rounded-lg border border-yellow-500/50 p-4 max-w-[300px] pointer-events-none">
        <div className="text-sm text-yellow-400 mb-1">城市特色</div>
        <div className="text-lg font-bold text-white">{template.name}</div>
        <div className="text-xs text-gray-400 mt-1">{template.description}</div>
      </div>
    )
  }

  // 如果没有可用特色，不显示
  if (specialization.available.length === 0) return null

  return (
    <ModalOverlay className="z-40">
      <div className="bg-gray-900 rounded-lg border border-yellow-500/50 p-4 max-w-[500px] w-full mx-4">
        <h2 className="text-lg font-bold text-yellow-400 mb-1">选择城市特色</h2>
        <p className="text-xs text-gray-400 mb-4">
          这是一次性不可逆的选择，将永久决定你的城市发展方向。
        </p>

        <div className="grid grid-cols-2 gap-3">
          {specialization.available.map(specId => {
            const template = SPECIALIZATION_TEMPLATES.find(t => t.id === specId)
            if (!template) return null

            return (
              <button
                className="text-left p-3 rounded-lg bg-gray-800 border border-gray-600 hover:border-yellow-500/50 hover:bg-gray-700 transition-colors"
                key={specId}
                onClick={() =>
                  engine.specializationSystem.chooseSpecialization(specId)
                }
                type="button"
              >
                <div className="text-sm font-bold text-white mb-1">
                  {template.name}
                </div>
                <div className="text-[10px] text-gray-400 space-y-0.5">
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
