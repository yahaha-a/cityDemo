import type { CrisisEffect } from 'shared/types'
import { useEngine } from '../context/game-engine-context'
import {
  useChallenge,
  useMoney,
  useTechState,
} from '../hooks/use-game-selector'
import { ModalOverlay } from './ui/modal-overlay'
import { SEVERITY_COLORS, SEVERITY_SEAL_COLORS } from './ui/theme'
import { cn } from 'renderer/lib/utils'

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
    engine.resolveCrisis(optionId)
  }

  return (
    <ModalOverlay className="z-50">
      <div className="game-parchment-bg game-wood-frame rounded-[var(--game-radius-lg)] p-5 max-w-[420px] w-full mx-4">
        {/* 标题 */}
        <div className="flex items-center gap-3 mb-3">
          <span
            className={cn(
              'game-seal w-8 h-8 text-white text-sm',
              SEVERITY_SEAL_COLORS[crisis.severity]
            )}
          >
            {crisis.severity === 'catastrophic'
              ? '!'
              : crisis.severity === 'major'
                ? '!'
                : crisis.severity === 'moderate'
                  ? '?'
                  : 'i'}
          </span>
          <div>
            <h2 className="text-lg font-bold font-[family-name:var(--font-heading)] text-[var(--game-text-heading)]">
              {crisis.name}
            </h2>
            <span className={cn('text-xs', SEVERITY_COLORS[crisis.severity])}>
              {SEVERITY_LABELS[crisis.severity]}
            </span>
          </div>
        </div>

        {/* 描述 */}
        <p className="text-sm text-[var(--game-text)] mb-4">
          {crisis.description}
        </p>

        {/* 选项 */}
        <div className="space-y-2">
          {crisis.options.map(option => {
            const canAfford = money >= option.cost
            const hasFacility =
              !option.requirements?.facility ||
              engine.hasFacility(option.requirements.facility)
            const hasTech =
              !option.requirements?.tech ||
              tech.researched.includes(option.requirements.tech)
            const canChoose = canAfford && hasFacility && hasTech

            return (
              <button
                className={cn(
                  'w-full text-left p-3 rounded-[var(--game-radius-md)] border transition-all',
                  canChoose
                    ? 'bg-[var(--game-parchment-light)] border-[var(--game-wood)]/40 hover:border-[var(--game-wood)] hover:shadow-[var(--game-shadow-button)] cursor-pointer'
                    : 'bg-[var(--game-parchment-dark)]/50 border-[var(--game-wood)]/20 cursor-not-allowed opacity-60'
                )}
                disabled={!canChoose}
                key={option.id}
                onClick={() => handleOption(option.id)}
                type="button"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-[var(--game-text-heading)]">
                    {option.label}
                  </span>
                  {option.cost > 0 && (
                    <span
                      className={cn(
                        'text-xs',
                        canAfford
                          ? 'text-[var(--game-green)]'
                          : 'text-[var(--game-red)]'
                      )}
                    >
                      ${option.cost}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--game-text-muted)]">
                  {option.description}
                </p>
                {option.effects.length > 0 && (
                  <div className="text-[10px] text-[var(--game-text-muted)] mt-1">
                    {option.effects
                      .map(e => formatEffect(e))
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
                {!hasFacility && option.requirements?.facility && (
                  <div className="text-[10px] text-[var(--game-red)] mt-1">
                    需要: 对应设施
                  </div>
                )}
                {!hasTech && option.requirements?.tech && (
                  <div className="text-[10px] text-[var(--game-red)] mt-1">
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
