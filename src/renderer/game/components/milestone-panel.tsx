import { useState } from 'react'
import type { GameState } from 'shared/game-types'
import { MILESTONES } from '../constants'

interface MilestonePanelProps {
  state: GameState
}

export function MilestonePanel({ state }: MilestonePanelProps) {
  const [collapsed, setCollapsed] = useState(true)
  const { milestones } = state
  const achievedCount = milestones.achieved.length
  const totalCount = MILESTONES.length

  return (
    <div className="absolute top-4 right-[220px] bg-gray-900/90 rounded-lg border border-gray-700 select-none min-w-[180px]">
      <button
        className="w-full px-3 py-2 flex justify-between items-center text-sm text-gray-300 hover:bg-gray-800/50 rounded-lg"
        onClick={() => setCollapsed(!collapsed)}
        type="button"
      >
        <span>
          里程碑 ({achievedCount}/{totalCount})
        </span>
        <span className="text-xs text-gray-500">
          {collapsed ? '展开' : '收起'}
        </span>
      </button>

      {!collapsed && (
        <div className="px-3 pb-2 space-y-1 max-h-[400px] overflow-y-auto">
          {MILESTONES.map(m => {
            const achieved = milestones.achieved.includes(m.id)
            return (
              <div
                className={`text-xs p-1.5 rounded ${
                  achieved
                    ? 'bg-green-900/40 text-green-300'
                    : 'bg-gray-800/50 text-gray-400'
                }`}
                key={m.id}
              >
                <div className="flex justify-between">
                  <span className="font-medium">
                    {achieved ? '\u2713 ' : ''}
                    {m.name}
                  </span>
                </div>
                <div className="text-[10px] opacity-70">{m.description}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
