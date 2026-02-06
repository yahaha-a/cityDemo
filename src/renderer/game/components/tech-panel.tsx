import { memo } from 'react'
import { TECH_TREE } from '../constants'
import { useEngine } from '../context/game-engine-context'
import { useTechState } from '../hooks/use-game-selector'
import { GamePanel } from './ui/game-panel'
import { ProgressBar } from './ui/progress-bar'

export const TechPanel = memo(function TechPanel() {
  const engine = useEngine()
  const tech = useTechState()
  const tiers = [1, 2, 3, 4]

  const currentNode = tech.currentResearch
    ? TECH_TREE.find(t => t.id === tech.currentResearch)
    : null
  const progress = engine.techSystem.getResearchProgress()

  return (
    <GamePanel
      className="absolute bottom-16 right-4 max-w-[300px] max-h-[450px] overflow-y-auto"
      size="md"
    >
      <div className="text-sm text-gray-400 pb-2 mb-2 border-b border-gray-700 flex justify-between">
        <span>科技树</span>
        <span className="text-xs text-purple-400">RP: {tech.dailyRP}/日</span>
      </div>

      {/* 当前研究 */}
      {currentNode && (
        <div className="mb-2 p-2 rounded bg-purple-900/30 border border-purple-500/30">
          <div className="text-xs text-purple-300 flex justify-between">
            <span>研究中: {currentNode.name}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <ProgressBar
            barColor="bg-purple-500"
            className="mt-1"
            percent={Math.round(progress * 100)}
          />
          <button
            className="text-[10px] text-gray-500 hover:text-red-400 mt-1"
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
            <div className="text-[10px] text-gray-500 mb-1">
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
                    className={`
                      w-full text-left px-2 py-1.5 rounded text-xs transition-colors
                      ${
                        isResearched
                          ? 'bg-green-900/30 text-green-300 border border-green-500/30'
                          : isCurrent
                            ? 'bg-purple-900/30 text-purple-300 border border-purple-500/30'
                            : canResearch
                              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-transparent'
                              : 'bg-gray-800/30 text-gray-600 border border-transparent cursor-not-allowed'
                      }
                    `}
                    disabled={isResearched || isCurrent || !canResearch}
                    key={node.id}
                    onClick={() => engine.techSystem.setResearch(node.id)}
                    type="button"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {isResearched ? '\u2713 ' : ''}
                        {node.name}
                      </span>
                      {!isResearched && (
                        <span className="text-[10px] text-gray-500">
                          {node.rpCost} RP
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {node.description}
                    </div>
                    {!prereqsMet && !isResearched && (
                      <div className="text-[10px] text-red-400/70 mt-0.5">
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
