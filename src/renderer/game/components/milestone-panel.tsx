import { memo, useState } from 'react'
import { MILESTONES } from '../constants'
import { useMilestones } from '../hooks/use-game-selector'
import { GamePanel, GamePanelHeader } from './ui/game-panel'
import { Trophy, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from 'renderer/lib/utils'

export const MilestonePanel = memo(function MilestonePanel() {
  const [showAll, setShowAll] = useState(false)
  const milestones = useMilestones()
  const achievedCount = milestones.achieved.length
  const totalCount = MILESTONES.length

  const displayMilestones = showAll ? MILESTONES : MILESTONES.slice(0, 6)

  return (
    <GamePanel
      className="relative min-w-[280px] max-h-[80vh] overflow-y-auto"
      size="md"
    >
      <GamePanelHeader>
        <div className="flex items-center gap-1.5">
          <Trophy className="text-[var(--game-gold)]" size={16} />
          <span>里程碑</span>
        </div>
        <span className="text-xs text-[var(--game-text-muted)]">
          {achievedCount}/{totalCount}
        </span>
      </GamePanelHeader>

      <div className="space-y-1.5">
        {displayMilestones.map(m => {
          const achieved = milestones.achieved.includes(m.id)
          return (
            <div
              className={cn(
                'text-xs p-2 rounded-[var(--game-radius-sm)] border transition-all',
                achieved
                  ? 'bg-gradient-to-r from-[var(--game-gold)]/15 to-[var(--game-parchment-light)] border-[var(--game-gold)]/40 text-[var(--game-text)]'
                  : 'bg-[var(--game-parchment-dark)]/30 border-[var(--game-wood)]/10 text-[var(--game-text-muted)]'
              )}
              key={m.id}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium flex items-center gap-1">
                  {achieved ? (
                    <span className="game-seal bg-[var(--game-gold)] text-white text-[8px]">
                      <Trophy size={10} />
                    </span>
                  ) : (
                    <Lock className="text-[var(--game-text-muted)]" size={12} />
                  )}
                  {m.name}
                </span>
              </div>
              <div className="text-[10px] opacity-70 mt-0.5">
                {m.description}
              </div>
            </div>
          )
        })}
      </div>

      {MILESTONES.length > 6 && (
        <button
          className="w-full mt-2 text-xs text-[var(--game-text-muted)] hover:text-[var(--game-text)] flex items-center justify-center gap-1 cursor-pointer py-1"
          onClick={() => setShowAll(!showAll)}
          type="button"
        >
          {showAll ? (
            <>
              <ChevronUp size={14} />
              收起
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              查看全部 ({totalCount})
            </>
          )}
        </button>
      )}
    </GamePanel>
  )
})
