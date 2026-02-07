import { memo, useMemo } from 'react'
import { useGameSelector } from '../hooks/use-game-selector'
import { PRODUCTION_CHAINS } from '../config/production'
import { TILE_LABELS } from '../config'
import { cn } from 'renderer/lib/utils'

export const ProductionPanel = memo(function ProductionPanel() {
  const productionChains = useGameSelector(s => s.productionChains, {
    keys: ['productionChains'],
  })
  const tech = useGameSelector(s => s.tech, { keys: ['tech'] })

  const visibleChains = useMemo(
    () =>
      PRODUCTION_CHAINS.filter(
        c => !c.unlockTech || tech.researched.includes(c.unlockTech)
      ),
    [tech.researched]
  )

  return (
    <div className="w-[340px] game-parchment-bg rounded-[var(--game-radius-lg)] border-2 border-[var(--game-wood)] shadow-[0_4px_16px_oklch(0.2_0.05_55/0.3)] p-4 space-y-3">
      <h3 className="text-sm font-bold text-[var(--game-text-heading)]">
        产业链
      </h3>

      {visibleChains.length === 0 && (
        <p className="text-xs text-[var(--game-text-muted)]">
          暂无可用产业链（需研究科技解锁）
        </p>
      )}

      {visibleChains.map(chain => {
        const active = productionChains.activeChains[chain.id]
        const ratio = active?.completionRatio ?? 0
        const percent = Math.round(ratio * 100)

        return (
          <div
            className="space-y-1.5 p-2 rounded-[var(--game-radius-sm)] bg-[var(--game-parchment-light)] border border-[var(--game-wood)]/20"
            key={chain.id}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--game-text-heading)]">
                {chain.name}
              </span>
              <span
                className={cn(
                  'text-[10px] font-bold',
                  percent >= 100
                    ? 'text-[var(--game-green)]'
                    : percent > 0
                      ? 'text-[var(--game-gold)]'
                      : 'text-[var(--game-text-muted)]'
                )}
              >
                {percent}%
              </span>
            </div>

            <p className="text-[10px] text-[var(--game-text-muted)]">
              {chain.description}
            </p>

            {/* 进度条 */}
            <div className="h-1.5 bg-[var(--game-wood)]/20 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  percent >= 100
                    ? 'bg-[var(--game-green)]'
                    : 'bg-[var(--game-gold)]'
                )}
                style={{ width: `${percent}%` }}
              />
            </div>

            {/* 节点详情 */}
            <div className="space-y-0.5">
              {chain.nodes.map((node, i) => {
                const nodeRatio = active?.nodeCompletion[i] ?? 0
                const nodePercent = Math.round(nodeRatio * 100)
                return (
                  <div
                    className="flex items-center justify-between text-[10px]"
                    key={`${chain.id}-node-${node.buildingType}-${i}`}
                  >
                    <span className="text-[var(--game-text)]">
                      {TILE_LABELS[node.buildingType]} x{node.requiredCount}
                    </span>
                    <span
                      className={cn(
                        nodePercent >= 100
                          ? 'text-[var(--game-green)]'
                          : 'text-[var(--game-text-muted)]'
                      )}
                    >
                      {nodePercent}%
                    </span>
                  </div>
                )
              })}
            </div>

            {/* 奖励信息 */}
            <div className="text-[10px] text-[var(--game-gold)]">
              奖励:{' '}
              {chain.completionBonus.type === 'satisfaction'
                ? `满意度 +${chain.completionBonus.value}`
                : chain.completionBonus.type === 'income_multiplier'
                  ? `${chain.completionBonus.target ?? ''}收入 x${chain.completionBonus.value}`
                  : `${chain.completionBonus.target ?? ''}效率 x${chain.completionBonus.value}`}
            </div>
          </div>
        )
      })}
    </div>
  )
})
