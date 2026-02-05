import { ToolType } from 'shared/game-types'
import { TOOL_LABELS, BUILDING_COSTS } from '../constants'
import { TileType } from 'shared/game-types'

const TOOLS = [
  { type: ToolType.Select, icon: '🖱', cost: null },
  { type: ToolType.Road, icon: '🛤', cost: BUILDING_COSTS[TileType.Road] },
  {
    type: ToolType.Residential,
    icon: '🏠',
    cost: BUILDING_COSTS[TileType.Residential],
  },
  {
    type: ToolType.Commercial,
    icon: '🏪',
    cost: BUILDING_COSTS[TileType.Commercial],
  },
  {
    type: ToolType.Industrial,
    icon: '🏭',
    cost: BUILDING_COSTS[TileType.Industrial],
  },
  { type: ToolType.Demolish, icon: '💥', cost: null },
]

interface ToolbarProps {
  currentTool: ToolType
  money: number
  onSelectTool: (tool: ToolType) => void
}

export function Toolbar({ currentTool, money, onSelectTool }: ToolbarProps) {
  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2 bg-gray-900/90 rounded-lg p-3 border border-gray-700 select-none">
      <div className="text-center text-sm text-gray-400 pb-2 border-b border-gray-700">
        建筑工具
      </div>

      {TOOLS.map(({ type, icon, cost }) => {
        const isActive = currentTool === type
        const canAfford = cost === null || money >= cost

        return (
          <button
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
              ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : canAfford
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
              }
            `}
            disabled={!canAfford}
            key={type}
            onClick={() => onSelectTool(type)}
            type="button"
          >
            <span className="text-lg">{icon}</span>
            <span>{TOOL_LABELS[type]}</span>
            {cost !== null && (
              <span
                className={`ml-auto text-xs ${canAfford ? 'text-green-400' : 'text-red-400'}`}
              >
                ${cost}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
