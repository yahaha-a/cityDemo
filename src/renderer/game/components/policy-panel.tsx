import { POLICY_TEMPLATES, MAX_ACTIVE_POLICIES } from '../constants'
import type { GameState } from 'shared/game-types'
import type { PolicySystem } from '../systems/policy-system'

interface PolicyPanelProps {
  state: GameState
  policySystem: PolicySystem
}

export function PolicyPanel({ state, policySystem }: PolicyPanelProps) {
  const { policies } = state
  const activeCount = policies.activePolicies.length

  const categories = [...new Set(POLICY_TEMPLATES.map(t => t.category))]

  return (
    <div className="absolute bottom-16 left-4 bg-gray-900/90 rounded-lg p-3 border border-gray-700 select-none max-w-[280px] max-h-[400px] overflow-y-auto">
      <div className="text-sm text-gray-400 pb-2 mb-2 border-b border-gray-700 flex justify-between">
        <span>政策管理</span>
        <span className="text-xs">
          {activeCount}/{MAX_ACTIVE_POLICIES}
        </span>
      </div>

      {categories.map(cat => (
        <div className="mb-2" key={cat}>
          <div className="text-xs text-gray-500 mb-1">{cat}</div>
          {POLICY_TEMPLATES.filter(t => t.category === cat).map(template => {
            const isActive = policies.activePolicies.includes(template.id)
            const { canToggle, reason } = policySystem.canTogglePolicy(
              template.id
            )
            const cooldown = policies.cooldowns[template.id] ?? 0

            return (
              <button
                className={`
                  w-full text-left px-2 py-1.5 rounded text-xs mb-1 transition-colors
                  ${
                    isActive
                      ? 'bg-blue-600/40 text-blue-200 border border-blue-500/50'
                      : canToggle
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-transparent'
                        : 'bg-gray-800/50 text-gray-600 border border-transparent cursor-not-allowed'
                  }
                `}
                disabled={!canToggle && !isActive}
                key={template.id}
                onClick={() => policySystem.togglePolicy(template.id)}
                title={reason}
                type="button"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{template.name}</span>
                  {isActive && (
                    <span className="text-[10px] text-blue-300">ON</span>
                  )}
                  {cooldown > 0 && (
                    <span className="text-[10px] text-gray-500">
                      {cooldown}d
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
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
                  <div className="text-[10px] text-red-400/70 mt-0.5">
                    {reason}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

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
