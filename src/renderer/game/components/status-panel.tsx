import { memo } from 'react'
import { POLICY_TEMPLATES, TECH_TREE } from '../constants'
import { useEngine } from '../context/game-engine-context'
import { usePolicies, useTechState } from '../hooks/use-game-selector'
import { GamePanel, GamePanelHeader, GamePanelDivider } from './ui/game-panel'
import { ProgressBar } from './ui/progress-bar'
import { ScrollText, FlaskConical, BookOpen } from 'lucide-react'

export const StatusPanel = memo(function StatusPanel() {
  const policies = usePolicies()
  const tech = useTechState()
  const engine = useEngine()

  const activePolicyNames = policies.activePolicies
    .map(id => POLICY_TEMPLATES.find(t => t.id === id)?.name)
    .filter(Boolean)

  const currentNode = tech.currentResearch
    ? TECH_TREE.find(t => t.id === tech.currentResearch)
    : null
  const progress = engine.techSystem.getResearchProgress()

  return (
    <GamePanel className="h-full rounded-none overflow-y-auto" size="sm">
      {/* 生效政策 */}
      <GamePanelHeader className="text-xs">
        <span className="flex items-center gap-1.5">
          <ScrollText className="text-[var(--game-blue)]" size={14} />
          生效政策
        </span>
      </GamePanelHeader>
      {activePolicyNames.length > 0 ? (
        <div className="space-y-1">
          {activePolicyNames.map(name => (
            <div
              className="flex items-center gap-1.5 text-xs text-[var(--game-text)]"
              key={name}
            >
              <span className="game-seal bg-[var(--game-blue)] text-white text-[8px]">
                ON
              </span>
              <span>{name}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-[var(--game-text-muted)]">无</div>
      )}

      {/* 研究进度 */}
      <GamePanelDivider />
      <GamePanelHeader className="text-xs">
        <span className="flex items-center gap-1.5">
          <FlaskConical className="text-[var(--game-purple)]" size={14} />
          研究进度
        </span>
      </GamePanelHeader>
      {currentNode ? (
        <div className="space-y-1">
          <div className="text-xs text-[var(--game-text)] flex items-center gap-1">
            <BookOpen className="text-[var(--game-purple)]" size={12} />
            <span>{currentNode.name}</span>
          </div>
          <ProgressBar
            barColor="bg-[var(--game-purple)]"
            percent={Math.round(progress * 100)}
          />
          <div className="text-[10px] text-[var(--game-text-muted)] flex justify-between">
            <span>{Math.round(progress * 100)}%</span>
            <span>{tech.dailyRP} RP/日</span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-[var(--game-text-muted)]">
          无研究中项目
        </div>
      )}
    </GamePanel>
  )
})
