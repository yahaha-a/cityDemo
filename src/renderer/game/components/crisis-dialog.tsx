import type { GameState } from 'shared/game-types'
import type { CrisisSystem } from '../systems/crisis-system'

interface CrisisDialogProps {
  state: GameState
  crisisSystem: CrisisSystem
}

const SEVERITY_COLORS: Record<string, string> = {
  minor: 'text-yellow-400',
  moderate: 'text-orange-400',
  major: 'text-red-400',
  catastrophic: 'text-red-600',
}

const SEVERITY_LABELS: Record<string, string> = {
  minor: '轻微',
  moderate: '中等',
  major: '严重',
  catastrophic: '灾难',
}

export function CrisisDialog({ state, crisisSystem }: CrisisDialogProps) {
  const crisis = state.challenge.pendingCrisis
  if (!crisis) return null

  const handleOption = (optionId: string) => {
    crisisSystem.resolveCrisis(optionId)
  }

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
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
            const canAfford = state.money >= option.cost
            const hasFacility =
              !option.requirements?.facility ||
              checkHasFacility(state, option.requirements.facility)
            const hasTech =
              !option.requirements?.tech ||
              state.tech.researched.includes(option.requirements.tech)
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
    </div>
  )
}

function checkHasFacility(
  state: GameState,
  facilityType: import('shared/game-types').TileType
): boolean {
  const { map } = state
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.tiles[y][x].type === facilityType && map.tiles[y][x].connected) {
        return true
      }
    }
  }
  return false
}

function formatEffect(
  effect: import('shared/game-types').CrisisEffect
): string {
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
