import { memo } from 'react'
import { TECH_TREE } from '../constants'
import { useEngine } from '../context/game-engine-context'
import { useTechState } from '../hooks/use-game-selector'
import { GamePanel, GamePanelHeader } from './ui/game-panel'
import { ProgressBar } from './ui/progress-bar'
import { FlaskConical, BookOpen, Lock, Check } from 'lucide-react'
import { cn } from 'renderer/lib/utils'

interface TechPanelProps {
  dailyRP: number
}

export const TechPanel = memo(function TechPanel({
  dailyRP,
}: TechPanelProps) {
  const engine = useEngine()
  const tech = useTechState()
  const tiers = [1, 2, 3, 4]

  const currentNode = tech.currentResearch
    ? TECH_TREE.find(t => t.id === tech.currentResearch)
    : null
  const progress = engine.techSystem.getResearchProgress()

  return (
    <GamePanel
      className="relative min-w-[320px] max-h-[80vh] overflow-y-auto"
      size="md"
    >
      <GamePanelHeader>
        <div className="flex items-center gap-1.5">
          <FlaskConical className="text-[var(--game-purple)]" size={16} />
          <span>科技树</span>
        </div>
        <span className="text-xs text-[var(--game-purple)]">
          RP: {dailyRP}/日
        </span>
      </GamePanelHeader>

      {/* 当前研究 */}
      {currentNode && (
        <div className="mb-2 p-2 rounded-[var(--game-radius-md)] bg-[var(--game-purple)]/10 border border-[var(--game-purple)]/30">
          <div className="text-xs text-[var(--game-purple)] flex justify-between">
            <span className="flex items-center gap-1">
              <BookOpen size={12} />
              研究中: {currentNode.name}
            </span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <ProgressBar
            barColor="bg-[var(--game-purple)]"
            className="mt-1"
            percent={Math.round(progress * 100)}
          />
          <button
            className="text-[10px] text-[var(--game-text-muted)] hover:text-[var(--game-red)] mt-1 cursor-pointer"
            onClick={() => engine.techSystem.cancelResearch()}
            type="button"
          >
            取消研究
          </button>
        </div>
      )}

      {/* 科技树层级 */}
      {tiers.map(tier => {
        const nodes = TECH_TREE.filter(t => t.tier === tier)
        return (
          <div className="mb-2" key={tier}>
            <div className="text-[10px] text-[var(--game-text-muted)] mb-1 font-[family-name:var(--font-heading)]">
              Tier {tier} {tier === 4 ? '(特色)' : ''}
            </div>
            <div className="space-y-1">
              {nodes.map(node => {
                const isResearched = tech.researched.includes(node.id)
                const isCurrent = tech.currentResearch === node.id
                const canResearch = engine.techSystem.canResearch(node.id)
                const prereqsMet = node.prerequisites.every(p =>
                  tech.researched.includes(p)
                )

                return (
                  <button
                    className={cn(
                      'w-full text-left px-2 py-1.5 rounded-[var(--game-radius-sm)] text-xs transition-all border',
                      isResearched
                        ? 'bg-[var(--game-green)]/10 text-[var(--game-text)] border-[var(--game-green)]/30'
                        : isCurrent
                          ? 'bg-[var(--game-purple)]/10 text-[var(--game-text)] border-[var(--game-purple)]/30'
                          : canResearch
                            ? 'bg-[var(--game-parchment-light)] text-[var(--game-text)] hover:bg-[var(--game-parchment-dark)] border-[var(--game-wood)]/30 cursor-pointer'
                            : 'bg-[var(--game-parchment-dark)]/30 text-[var(--game-text-muted)] border-transparent cursor-not-allowed opacity-60'
                    )}
                    disabled={isResearched || isCurrent || !canResearch}
                    key={node.id}
                    onClick={() => engine.techSystem.setResearch(node.id)}
                    type="button"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium flex items-center gap-1">
                        {isResearched ? (
                          <Check
                            className="text-[var(--game-green)]"
                            size={12}
                          />
                        ) : !prereqsMet && !isResearched ? (
                          <Lock
                            className="text-[var(--game-text-muted)]"
                            size={12}
                          />
                        ) : null}
                        {node.name}
                      </span>
                      {!isResearched && (
                        <span className="text-[10px] text-[var(--game-text-muted)]">
                          {node.rpCost} RP
                        </span>
                      )}
                      {isResearched && (
                        <span className="game-seal bg-[var(--game-green)] text-white">
                          <Check size={10} />
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--game-text-muted)] mt-0.5">
                      {node.description}
                    </div>
                    {!prereqsMet && !isResearched && (
                      <div className="text-[10px] text-[var(--game-red)] mt-0.5">
                        需要:{' '}
                        {node.prerequisites
                          .map(p => {
                            const prereqNode = TECH_TREE.find(t => t.id === p)
                            return prereqNode?.name ?? p
                          })
                          .join(', ')}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </GamePanel>
  )
})
