import { memo, useMemo, useState } from 'react'
import { ToolType, TileType } from 'shared/game-types'
import type { DemandIndicators } from 'shared/game-types'
import { TOOL_LABELS, BUILDING_COSTS, FACILITY_TEMPLATES } from '../constants'
import {
  useCurrentTool,
  useMoney,
  useEconomy,
  useTechState,
} from '../hooks/use-game-selector'
import { DEMAND_DOT_COLORS } from './ui/theme'
import {
  MousePointer2,
  Route,
  Home,
  Store,
  Factory,
  TreePine,
  GraduationCap,
  Cross,
  Flame,
  Shield,
  Zap,
  ArrowBigUp,
  Trash2,
  Trophy,
  ScrollText,
  FlaskConical,
  Landmark,
} from 'lucide-react'
import { cn } from 'renderer/lib/utils'

const TOOL_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  [ToolType.Select]: MousePointer2,
  [ToolType.Road]: Route,
  [ToolType.Residential]: Home,
  [ToolType.Commercial]: Store,
  [ToolType.Industrial]: Factory,
  [ToolType.Park]: TreePine,
  [ToolType.School]: GraduationCap,
  [ToolType.Hospital]: Cross,
  [ToolType.FireStation]: Flame,
  [ToolType.PoliceStation]: Shield,
  [ToolType.PowerPlant]: Zap,
  [ToolType.Upgrade]: ArrowBigUp,
  [ToolType.Demolish]: Trash2,
}

const CORE_TOOLS = [
  { type: ToolType.Select, cost: null },
  { type: ToolType.Road, cost: BUILDING_COSTS[TileType.Road] },
  { type: ToolType.Residential, cost: BUILDING_COSTS[TileType.Residential] },
  { type: ToolType.Commercial, cost: BUILDING_COSTS[TileType.Commercial] },
  { type: ToolType.Industrial, cost: BUILDING_COSTS[TileType.Industrial] },
]

const FACILITY_TOOLS = [
  { type: ToolType.Park, tileType: TileType.Park },
  { type: ToolType.School, tileType: TileType.School },
  { type: ToolType.Hospital, tileType: TileType.Hospital },
  { type: ToolType.FireStation, tileType: TileType.FireStation },
  { type: ToolType.PoliceStation, tileType: TileType.PoliceStation },
  { type: ToolType.PowerPlant, tileType: TileType.PowerPlant },
]

const ACTION_TOOLS = [{ type: ToolType.Upgrade }, { type: ToolType.Demolish }]

const TOOL_TO_DEMAND_KEY: Partial<Record<ToolType, keyof DemandIndicators>> = {
  [ToolType.Residential]: 'residential',
  [ToolType.Commercial]: 'commercial',
  [ToolType.Industrial]: 'industrial',
}

export type ModalType = 'milestones' | 'policy' | 'tech' | null

interface DockToolbarProps {
  onSelectTool: (tool: ToolType) => void
  activeModal: ModalType
  onToggleModal: (modal: ModalType) => void
}

const PANEL_BUTTONS: {
  panel: NonNullable<ModalType>
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
}[] = [
  { panel: 'milestones', icon: Trophy, label: '成就' },
  { panel: 'policy', icon: ScrollText, label: '政策' },
  { panel: 'tech', icon: FlaskConical, label: '科技' },
]

function DockIcon({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
  demandLevel,
  cost,
  canAfford,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  demandLevel?: string | null
  cost?: number | null
  canAfford?: boolean
}) {
  return (
    <div className="relative group">
      <button
        className={cn(
          'w-10 h-10 flex items-center justify-center rounded-[var(--game-radius-md)] border transition-all cursor-pointer',
          active
            ? 'bg-[var(--game-gold)] border-[var(--game-wood-dark)] shadow-[var(--game-shadow-inset)] text-[var(--game-text-heading)]'
            : 'bg-[var(--game-parchment-light)] border-[var(--game-wood)] text-[var(--game-text)] hover:bg-[var(--game-parchment-dark)] shadow-[var(--game-shadow-button)] active:translate-y-[1px] active:shadow-none',
          disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
        )}
        data-active={active}
        disabled={disabled}
        onClick={onClick}
        title={label}
        type="button"
      >
        <Icon size={18} />
        {demandLevel && (
          <span
            className={cn(
              'absolute top-0.5 right-0.5 w-2 h-2 rounded-full',
              demandLevel
            )}
          />
        )}
      </button>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-[var(--game-radius-sm)] bg-[var(--game-parchment)] border border-[var(--game-wood)] text-[10px] text-[var(--game-text)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-[var(--game-shadow-button)]">
        {label}
        {cost != null && (
          <span
            className={cn(
              'ml-1',
              canAfford ? 'text-[var(--game-green)]' : 'text-[var(--game-red)]'
            )}
          >
            ${cost}
          </span>
        )}
      </div>
    </div>
  )
}

export const DockToolbar = memo(function DockToolbar({
  onSelectTool,
  activeModal,
  onToggleModal,
}: DockToolbarProps) {
  const currentTool = useCurrentTool()
  const money = useMoney()
  const economy = useEconomy()
  const tech = useTechState()
  const [facilityMenuOpen, setFacilityMenuOpen] = useState(false)

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

  const isFacilityToolActive = FACILITY_TOOLS.some(
    f => f.type === currentTool
  )

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-end gap-1 px-3 py-2 bg-[var(--game-wood)] rounded-[var(--game-radius-lg)] border-2 border-[var(--game-wood-dark)] shadow-[0_-2px_12px_oklch(0.2_0.05_55/0.3)] animate-[slideUp_0.3s_ease-out]">
      {/* 核心建筑工具 */}
      {CORE_TOOLS.map(({ type, cost }) => {
        const isActive = currentTool === type
        const canAfford = cost === null || money >= cost
        const demandKey = TOOL_TO_DEMAND_KEY[type]
        const demandLevel = demandKey
          ? DEMAND_DOT_COLORS[demandIndicators[demandKey]]
          : null

        return (
          <DockIcon
            active={isActive}
            canAfford={canAfford}
            cost={cost}
            demandLevel={demandLevel}
            disabled={cost !== null && !canAfford}
            icon={TOOL_ICONS[type] ?? MousePointer2}
            key={type}
            label={TOOL_LABELS[type]}
            onClick={() => onSelectTool(type)}
          />
        )
      })}

      {/* 设施按钮 + 弹出菜单 */}
      {unlockedFacilities.length > 0 && (
        <>
          <div className="w-px h-8 bg-[var(--game-wood-light)] opacity-50 mx-0.5" />
          <div className="relative">
            <DockIcon
              active={isFacilityToolActive || facilityMenuOpen}
              icon={Landmark}
              label="设施"
              onClick={() => setFacilityMenuOpen(prev => !prev)}
            />
            {facilityMenuOpen && (
              <>
                {/* 透明遮罩 - 点击外部关闭 */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setFacilityMenuOpen(false)}
                  onKeyDown={() => {}}
                />
                {/* 弹出菜单 */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 flex flex-col gap-1 p-2 bg-[var(--game-parchment)] border-2 border-[var(--game-wood)] rounded-[var(--game-radius-lg)] shadow-[0_4px_16px_oklch(0.2_0.05_55/0.3)] animate-[scaleIn_0.15s_ease-out]">
                  {unlockedFacilities.map(({ type, tileType }) => {
                    const template = FACILITY_TEMPLATES.find(
                      t => t.tileType === tileType
                    )
                    const cost = template?.buildCost ?? 0
                    const isActive = currentTool === type
                    const canAfford = money >= cost
                    const FIcon = TOOL_ICONS[type] ?? MousePointer2

                    return (
                      <button
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded-[var(--game-radius-sm)] text-xs transition-all border whitespace-nowrap cursor-pointer',
                          isActive
                            ? 'bg-[var(--game-gold)] border-[var(--game-wood-dark)] text-[var(--game-text-heading)]'
                            : canAfford
                              ? 'bg-[var(--game-parchment-light)] border-[var(--game-wood)]/30 text-[var(--game-text)] hover:bg-[var(--game-parchment-dark)]'
                              : 'opacity-40 cursor-not-allowed border-[var(--game-wood)]/20 text-[var(--game-text-muted)]'
                        )}
                        disabled={!canAfford}
                        key={type}
                        onClick={() => {
                          onSelectTool(type)
                          setFacilityMenuOpen(false)
                        }}
                        type="button"
                      >
                        <FIcon size={14} />
                        <span>{TOOL_LABELS[type]}</span>
                        <span
                          className={cn(
                            'ml-auto text-[10px]',
                            canAfford
                              ? 'text-[var(--game-green)]'
                              : 'text-[var(--game-red)]'
                          )}
                        >
                          ${cost}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* 分隔线 */}
      <div className="w-px h-8 bg-[var(--game-wood-light)] opacity-50 mx-0.5" />

      {/* 操作工具 */}
      {ACTION_TOOLS.map(({ type }) => {
        const isActive = currentTool === type
        return (
          <DockIcon
            active={isActive}
            icon={TOOL_ICONS[type] ?? MousePointer2}
            key={type}
            label={TOOL_LABELS[type]}
            onClick={() => onSelectTool(type)}
          />
        )
      })}

      {/* 分隔线 */}
      <div className="w-px h-8 bg-[var(--game-wood-light)] opacity-50 mx-0.5" />

      {/* 面板切换按钮 */}
      {PANEL_BUTTONS.map(({ panel, icon, label }) => (
        <DockIcon
          active={activeModal === panel}
          icon={icon}
          key={panel}
          label={label}
          onClick={() => onToggleModal(activeModal === panel ? null : panel)}
        />
      ))}
    </div>
  )
})
