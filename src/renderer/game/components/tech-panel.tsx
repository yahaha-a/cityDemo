import { TECH_TREE } from '../constants'
import type { GameState } from 'shared/game-types'
import type { TechSystem } from '../systems/tech-system'

interface TechPanelProps {
  state: GameState
  techSystem: TechSystem
}

export function TechPanel({ state, techSystem }: TechPanelProps) {
  const { tech } = state
  const tiers = [1, 2, 3, 4]

  const currentNode = tech.currentResearch
    ? TECH_TREE.find(t => t.id === tech.currentResearch)
    : null
  const progress = techSystem.getResearchProgress()

  return (
    <div className="absolute bottom-16 right-4 bg-gray-900/90 rounded-lg p-3 border border-gray-700 select-none max-w-[300px] max-h-[450px] overflow-y-auto">
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
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mt-1">
            <div
              className="h-full rounded-full bg-purple-500"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <button
            className="text-[10px] text-gray-500 hover:text-red-400 mt-1"
            onClick={() => techSystem.cancelResearch()}
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
                const canResearch = techSystem.canResearch(node.id)
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
                    onClick={() => techSystem.setResearch(node.id)}
                    type="button"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {isResearched ? '✓ ' : ''}
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
    </div>
  )
}
