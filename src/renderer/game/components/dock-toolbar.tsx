import { memo, useMemo, useState } from 'react'
import { ToolType, isRoadTool, isTerraformTool } from 'shared/types'
import type { BuildingId, BuildingCategory } from 'shared/types/building-defs'
import { TOOL_LABELS } from '../config'
import { ROAD_CONFIGS } from '../config/road'
import { TERRAFORM_ACTIONS } from '../config/terraform'
import { getBuildingsByCategory } from '../config/building-defs'
import {
  useCurrentTool,
  useMoney,
  useTechState,
  useGameSelector,
} from '../hooks/use-game-selector'
import { useEngine } from '../context/game-engine-context'
import { MousePointer2, Route, Mountain, Building2 } from 'lucide-react'
import { cn } from 'renderer/lib/utils'
import { PopupMenu, PopupMenuItem } from './popup-menu'
import {
  TOOL_ICONS,
  BUILDING_ICONS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  ROAD_TOOLS,
  ACTION_TOOLS,
  PANEL_BUTTONS,
} from './toolbar-constants'

export type ModalType = 'milestones' | 'policy' | 'tech' | null

interface DockToolbarProps {
  onSelectTool: (tool: ToolType) => void
  activeModal: ModalType
  onToggleModal: (modal: ModalType) => void
}

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

/** 建筑分类弹出菜单 */
function BuildingCategoryMenu({
  category,
  money,
  selectedBuildingId,
  researchedTechs,
  achievedMilestones,
  onSelect,
}: {
  category: BuildingCategory
  money: number
  selectedBuildingId: BuildingId | null
  researchedTechs: string[]
  achievedMilestones: string[]
  onSelect: (buildingId: BuildingId) => void
}) {
  const [open, setOpen] = useState(false)
  const CatIcon = CATEGORY_ICONS[category]

  const buildings = useMemo(() => {
    return getBuildingsByCategory(category)
  }, [category])

  const isAnyCategoryActive = selectedBuildingId
    ? buildings.some(b => b.id === selectedBuildingId)
    : false

  return (
    <div className="relative">
      <DockIcon
        active={isAnyCategoryActive || open}
        icon={CatIcon}
        label={CATEGORY_LABELS[category]}
        onClick={() => setOpen(prev => !prev)}
      />
      <PopupMenu onClose={() => setOpen(false)} open={open}>
        {buildings.map(def => {
          const isActive = selectedBuildingId === def.id
          const canAfford = money >= def.cost
          const BIcon = BUILDING_ICONS[def.id] ?? Building2

          // 检查解锁
          let unlocked = true
          if (def.unlockCondition.type === 'tech') {
            unlocked = researchedTechs.includes(def.unlockCondition.id!)
          } else if (def.unlockCondition.type === 'milestone') {
            unlocked = achievedMilestones.includes(def.unlockCondition.id!)
          }

          const footprintW = Math.max(...def.footprint.map(f => f.dx)) + 1
          const footprintH = Math.max(...def.footprint.map(f => f.dy)) + 1
          const footprintLabel =
            footprintW === 1 && footprintH === 1
              ? '1x1'
              : `${footprintW}x${footprintH}`

          return (
            <PopupMenuItem
              active={isActive}
              canAfford={canAfford}
              cost={def.cost}
              disabled={!unlocked || !canAfford}
              extra={
                <>
                  <span className="text-[9px] text-[var(--game-text-muted)]">
                    {footprintLabel}
                  </span>
                  {!unlocked && (
                    <span className="text-[9px] text-[var(--game-red)]">
                      未解锁
                    </span>
                  )}
                </>
              }
              icon={BIcon}
              key={def.id}
              label={def.name}
              onClick={() => {
                onSelect(isActive ? ('empty' as BuildingId) : def.id)
                setOpen(false)
              }}
            />
          )
        })}
      </PopupMenu>
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
  const tech = useTechState()
  const engine = useEngine()
  const milestones = useGameSelector(s => s.milestones, {
    keys: ['milestones'],
  })
  const selectedBuildingId = useGameSelector(s => s.selectedBuildingId, {
    keys: ['selectedBuildingId'],
  })
  const [roadMenuOpen, setRoadMenuOpen] = useState(false)
  const [terraformMenuOpen, setTerraformMenuOpen] = useState(false)

  const researchedTechs = tech.researched
  const achievedMilestones = milestones.achieved

  const isRoadToolActive = isRoadTool(currentTool)
  const isTerraformToolActive = isTerraformTool(currentTool)

  const unlockedTerraformActions = useMemo(
    () =>
      TERRAFORM_ACTIONS.filter(
        a => !a.unlockTech || researchedTechs.includes(a.unlockTech)
      ),
    [researchedTechs]
  )

  const handleSelectBuilding = (buildingId: BuildingId) => {
    if (buildingId === 'empty') {
      engine.setSelectedBuildingId(null)
      onSelectTool(ToolType.Select)
    } else {
      // 先切工具到 Select（会清 selectedBuildingId），再设 selectedBuildingId
      onSelectTool(ToolType.Select)
      engine.setSelectedBuildingId(buildingId)
    }
  }

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-end gap-1 px-3 py-2 bg-[var(--game-wood)] rounded-[var(--game-radius-lg)] border-2 border-[var(--game-wood-dark)] shadow-[0_-2px_12px_oklch(0.2_0.05_55/0.3)] animate-[slideUp_0.3s_ease-out]">
      {/* 选择工具 */}
      <DockIcon
        active={currentTool === ToolType.Select && !selectedBuildingId}
        icon={TOOL_ICONS[ToolType.Select] ?? MousePointer2}
        label={TOOL_LABELS[ToolType.Select]}
        onClick={() => {
          engine.setSelectedBuildingId(null)
          onSelectTool(ToolType.Select)
        }}
      />

      {/* 道路按钮 + 弹出菜单 */}
      <div className="relative">
        <DockIcon
          active={isRoadToolActive || roadMenuOpen}
          icon={Route}
          label="道路"
          onClick={() => setRoadMenuOpen(prev => !prev)}
        />
        <PopupMenu onClose={() => setRoadMenuOpen(false)} open={roadMenuOpen}>
          {ROAD_TOOLS.map(({ type, roadType }) => {
            const config = ROAD_CONFIGS[roadType]
            const cost = config.buildCost
            const isActive = currentTool === type
            const canAfford = money >= cost
            const RIcon = TOOL_ICONS[type] ?? Route

            const terrainHint =
              config.terrainAllowances.length > 0
                ? `仅: ${config.terrainAllowances.join(', ')}`
                : config.terrainRestrictions.length > 0
                  ? `禁: ${config.terrainRestrictions.join(', ')}`
                  : ''

            return (
              <PopupMenuItem
                active={isActive}
                canAfford={canAfford}
                cost={cost}
                disabled={!canAfford}
                extra={
                  terrainHint ? (
                    <span className="text-[9px] text-[var(--game-text-muted)]">
                      {terrainHint}
                    </span>
                  ) : undefined
                }
                icon={RIcon}
                key={type}
                label={TOOL_LABELS[type]}
                onClick={() => {
                  engine.setSelectedBuildingId(null)
                  onSelectTool(type)
                  setRoadMenuOpen(false)
                }}
              />
            )
          })}
        </PopupMenu>
      </div>

      {/* 分隔线 */}
      <div className="w-px h-8 bg-[var(--game-wood-light)] opacity-50 mx-0.5" />

      {/* 建筑分类菜单 */}
      {(
        [
          'residential',
          'commercial',
          'industrial',
          'service',
        ] as BuildingCategory[]
      ).map(category => (
        <BuildingCategoryMenu
          achievedMilestones={achievedMilestones}
          category={category}
          key={category}
          money={money}
          onSelect={handleSelectBuilding}
          researchedTechs={researchedTechs}
          selectedBuildingId={selectedBuildingId}
        />
      ))}

      {/* 地形改造按钮 + 弹出菜单 */}
      {unlockedTerraformActions.length > 0 && (
        <>
          <div className="w-px h-8 bg-[var(--game-wood-light)] opacity-50 mx-0.5" />
          <div className="relative">
            <DockIcon
              active={isTerraformToolActive || terraformMenuOpen}
              icon={Mountain}
              label="地形改造"
              onClick={() => setTerraformMenuOpen(prev => !prev)}
            />
            <PopupMenu
              onClose={() => setTerraformMenuOpen(false)}
              open={terraformMenuOpen}
            >
              {unlockedTerraformActions.map(action => {
                const isActive = currentTool === action.tool
                const canAfford = money >= action.cost
                const TIcon = TOOL_ICONS[action.tool] ?? Mountain

                return (
                  <PopupMenuItem
                    active={isActive}
                    canAfford={canAfford}
                    cost={action.cost}
                    disabled={!canAfford}
                    icon={TIcon}
                    key={action.tool}
                    label={action.name}
                    onClick={() => {
                      onSelectTool(action.tool)
                      setTerraformMenuOpen(false)
                    }}
                  />
                )
              })}
            </PopupMenu>
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
            onClick={() => {
              engine.setSelectedBuildingId(null)
              onSelectTool(type)
            }}
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
