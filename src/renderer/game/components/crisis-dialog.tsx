import type { CrisisEffect } from 'shared/game-types'
import { useEngine } from '../context/game-engine-context'
import {
  useChallenge,
  useMoney,
  useTechState,
} from '../hooks/use-game-selector'
import { ModalOverlay } from './ui/modal-overlay'
import { SEVERITY_COLORS } from './ui/theme'

const SEVERITY_LABELS: Record<string, string> = {
  minor: '轻微',
  moderate: '中等',
  major: '严重',
  catastrophic: '灾难',
}

export function CrisisDialog() {
  const engine = useEngine()
  const challenge = useChallenge()
  const money = useMoney()
  const tech = useTechState()

  const crisis = challenge.pendingCrisis
  if (!crisis) return null

  const handleOption = (optionId: string) => {
    engine.crisisSystem.resolveCrisis(optionId)
  }

  return (
    <ModalOverlay className="z-50">
      <div className="bg-gray-900 rounded-lg border border-gray-600 p-4 max-w-[400px] w-full mx-4 shadow-2xl">
        {/* 标题 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">
            {crisis.severity === 'catastrophic'
              ? '💀'
              : crisis.severity === 'major'
                ? '🔥'
                : crisis.severity === 'moderate'
                  ? '⚠'
                  : '📋'}
          </span>
          <div>
            <h2 className="text-lg font-bold text-white">{crisis.name}</h2>
            <span className={`text-xs ${SEVERITY_COLORS[crisis.severity]}`}>
              {SEVERITY_LABELS[crisis.severity]}
            </span>
          </div>
        </div>

        {/* 描述 */}
        <p className="text-sm text-gray-300 mb-4">{crisis.description}</p>

        {/* 选项 */}
        <div className="space-y-2">
          {crisis.options.map(option => {
            const canAfford = money >= option.cost
            const hasFacility =
              !option.requirements?.facility ||
              engine.crisisSystem.hasFacility(option.requirements.facility)
            const hasTech =
              !option.requirements?.tech ||
              tech.researched.includes(option.requirements.tech)
            const canChoose = canAfford && hasFacility && hasTech

            return (
              <button
                className={`
                  w-full text-left p-3 rounded-lg border transition-colors
                  ${
                    canChoose
                      ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                      : 'bg-gray-800/50 border-gray-700/50 cursor-not-allowed opacity-60'
                  }
                `}
                disabled={!canChoose}
                key={option.id}
                onClick={() => handleOption(option.id)}
                type="button"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-white">
                    {option.label}
                  </span>
                  {option.cost > 0 && (
                    <span
                      className={`text-xs ${canAfford ? 'text-green-400' : 'text-red-400'}`}
                    >
                      ${option.cost}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{option.description}</p>
                {option.effects.length > 0 && (
                  <div className="text-[10px] text-gray-500 mt-1">
                    {option.effects
                      .map(e => formatEffect(e))
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
                {!hasFacility && option.requirements?.facility && (
                  <div className="text-[10px] text-red-400 mt-1">
                    需要: 对应设施
                  </div>
                )}
                {!hasTech && option.requirements?.tech && (
                  <div className="text-[10px] text-red-400 mt-1">
                    需要: 对应科技
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </ModalOverlay>
  )
}

function formatEffect(effect: CrisisEffect): string {
  switch (effect.type) {
    case 'satisfaction':
      return `满意度 ${effect.value > 0 ? '+' : ''}${effect.value}`
    case 'money':
      return `资金 ${effect.value > 0 ? '+' : ''}${effect.value}`
    case 'population_loss':
      return `人口 -${effect.value}`
    case 'income_multiplier_temp':
      return `收入 ${Math.round((effect.value - 1) * 100)}% (${effect.durationDays}天)`
    case 'industrial_multiplier_temp':
      return `工业 ${Math.round((effect.value - 1) * 100)}% (${effect.durationDays}天)`
    case 'services_multiplier_temp':
      return `服务 ${Math.round((effect.value - 1) * 100)}% (${effect.durationDays}天)`
    case 'prevent_chain':
      return '阻止连锁'
    default:
      return ''
  }
}
