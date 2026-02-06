import { memo, useMemo } from 'react'
import { ToolType, TileType } from 'shared/game-types'
import type { DemandIndicators } from 'shared/game-types'
import { TOOL_LABELS, BUILDING_COSTS, FACILITY_TEMPLATES } from '../constants'
import {
  useCurrentTool,
  useMoney,
  useEconomy,
  useTechState,
} from '../hooks/use-game-selector'
import { GameButton } from './ui/game-button'
import { GamePanel } from './ui/game-panel'
import { DEMAND_DOT_COLORS } from './ui/theme'

const CORE_TOOLS = [
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
]

const FACILITY_TOOLS = [
  { type: ToolType.Park, icon: '🌳', tileType: TileType.Park },
  { type: ToolType.School, icon: '🏫', tileType: TileType.School },
  { type: ToolType.Hospital, icon: '🏥', tileType: TileType.Hospital },
  { type: ToolType.FireStation, icon: '🚒', tileType: TileType.FireStation },
  {
    type: ToolType.PoliceStation,
    icon: '👮',
    tileType: TileType.PoliceStation,
  },
  { type: ToolType.PowerPlant, icon: '⚡', tileType: TileType.PowerPlant },
]

const ACTION_TOOLS = [
  { type: ToolType.Upgrade, icon: '⬆', cost: null },
  { type: ToolType.Demolish, icon: '💥', cost: null },
]

const TOOL_TO_DEMAND_KEY: Partial<Record<ToolType, keyof DemandIndicators>> = {
  [ToolType.Residential]: 'residential',
  [ToolType.Commercial]: 'commercial',
  [ToolType.Industrial]: 'industrial',
}

interface ToolbarProps {
  onSelectTool: (tool: ToolType) => void
}

export const Toolbar = memo(function Toolbar({ onSelectTool }: ToolbarProps) {
  const currentTool = useCurrentTool()
  const money = useMoney()
  const economy = useEconomy()
  const tech = useTechState()

  const demandIndicators = economy.demandIndicators
  const researchedTechs = tech.researched

  const unlockedFacilities = useMemo(
    () =>
      FACILITY_TOOLS.filter(tool => {
        const template = FACILITY_TEMPLATES.find(
          t => t.tileType === tool.tileType
        )
        if (!template) return false
        if (!template.unlockTech) return true
        return researchedTechs.includes(template.unlockTech)
      }),
    [researchedTechs]
  )

  return (
    <GamePanel
      className="flex flex-col gap-2 max-h-[calc(100vh-2rem)] overflow-y-auto"
      position="top-left"
      size="md"
    >
      <div className="text-center text-sm text-gray-400 pb-2 border-b border-gray-700">
        建筑工具
      </div>

      {/* 核心工具 */}
      {CORE_TOOLS.map(({ type, icon, cost }) => {
        const isActive = currentTool === type
        const canAfford = cost === null || money >= cost
        const demandKey = TOOL_TO_DEMAND_KEY[type]
        const demandLevel = demandKey ? demandIndicators[demandKey] : null

        return (
          <GameButton
            disabled={!canAfford}
            intent={isActive ? 'active' : 'default'}
            key={type}
            onClick={() => onSelectTool(type)}
            variant="tool"
          >
            <span className="text-lg">{icon}</span>
            <span>{TOOL_LABELS[type]}</span>
            {demandLevel && (
              <span
                className={`w-2 h-2 rounded-full ml-1 ${DEMAND_DOT_COLORS[demandLevel]}`}
              />
            )}
            {cost !== null && (
              <span
                className={`ml-auto text-xs ${canAfford ? 'text-green-400' : 'text-red-400'}`}
              >
                ${cost}
              </span>
            )}
          </GameButton>
        )
      })}

      {/* 设施工具（解锁后显示） */}
      {unlockedFacilities.length > 0 && (
        <>
          <div className="text-center text-xs text-gray-500 pt-1 border-t border-gray-700">
            设施
          </div>
          {unlockedFacilities.map(({ type, icon, tileType }) => {
            const template = FACILITY_TEMPLATES.find(
              t => t.tileType === tileType
            )
            const cost = template?.buildCost ?? 0
            const isActive = currentTool === type
            const canAfford = money >= cost

            return (
              <GameButton
                disabled={!canAfford}
                intent={isActive ? 'active' : 'default'}
                key={type}
                onClick={() => onSelectTool(type)}
                variant="tool"
              >
                <span className="text-lg">{icon}</span>
                <span>{TOOL_LABELS[type]}</span>
                <span
                  className={`ml-auto text-xs ${canAfford ? 'text-green-400' : 'text-red-400'}`}
                >
                  ${cost}
                </span>
              </GameButton>
            )
          })}
        </>
      )}

      {/* 操作工具 */}
      <div className="pt-1 border-t border-gray-700">
        {ACTION_TOOLS.map(({ type, icon }) => {
          const isActive = currentTool === type
          return (
            <GameButton
              className="w-full"
              intent={isActive ? 'active' : 'default'}
              key={type}
              onClick={() => onSelectTool(type)}
              variant="tool"
            >
              <span className="text-lg">{icon}</span>
              <span>{TOOL_LABELS[type]}</span>
            </GameButton>
          )
        })}
      </div>
    </GamePanel>
  )
})
