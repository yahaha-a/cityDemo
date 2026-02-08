import { memo, useMemo, useState } from 'react'
import { ToolType, RoadType, isRoadTool, isTerraformTool } from 'shared/types'
import type { DemandIndicators } from 'shared/types'
import type { BuildingId, BuildingCategory } from 'shared/types/building-defs'
import { TOOL_LABELS } from '../config'
import { ROAD_CONFIGS } from '../config/road'
import { TERRAFORM_ACTIONS } from '../config/terraform'
import { getBuildingsByCategory } from '../config/building-defs'
import {
  useCurrentTool,
  useMoney,
  useEconomy,
  useTechState,
  useGameSelector,
} from '../hooks/use-game-selector'
import { useEngine } from '../context/game-engine-context'
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
  Mountain,
  Droplets,
  Shovel,
  MountainSnow,
  Building2,
  Waypoints,
  Landmark,
  Warehouse,
  Hotel,
  ShoppingBag,
  Briefcase,
} from 'lucide-react'
import { cn } from 'renderer/lib/utils'

const TOOL_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  [ToolType.Select]: MousePointer2,
  [ToolType.Road]: Route,
  [ToolType.Highway]: Waypoints,
  [ToolType.Bridge]: Route,
  [ToolType.Tunnel]: Route,
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
  [ToolType.FlattenTerrain]: Mountain,
  [ToolType.FillWater]: Droplets,
  [ToolType.DigChannel]: Shovel,
  [ToolType.CreateHill]: MountainSnow,
}

/** 建筑 ID → 图标映射 */
const BUILDING_ICONS: Partial<
  Record<BuildingId, React.ComponentType<{ size?: number; className?: string }>>
> = {
  house: Home,
  apartment: Hotel,
  residential_complex: Building2,
  shop: Store,
  office: Briefcase,
  mall: ShoppingBag,
  factory: Factory,
  heavy_industry: Factory,
  warehouse: Warehouse,
  park: TreePine,
  plaza: Landmark,
  school: GraduationCap,
  hospital: Cross,
  fire_station: Flame,
  police_station: Shield,
  power_plant: Zap,
}

/** 分类图标 */
const CATEGORY_ICONS: Record<
  BuildingCategory,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  residential: Home,
  commercial: Store,
  industrial: Factory,
  service: Landmark,
}

const CATEGORY_LABELS: Record<BuildingCategory, string> = {
  residential: '住宅',
  commercial: '商业',
  industrial: '工业',
  service: '服务',
}

const ROAD_TOOLS = [
  { type: ToolType.Road, roadType: RoadType.Normal },
  { type: ToolType.Highway, roadType: RoadType.Highway },
  { type: ToolType.Bridge, roadType: RoadType.Bridge },
  { type: ToolType.Tunnel, roadType: RoadType.Tunnel },
]

const ACTION_TOOLS = [{ type: ToolType.Upgrade }, { type: ToolType.Demolish }]

const _TOOL_TO_DEMAND_KEY: Partial<Record<ToolType, keyof DemandIndicators>> = {
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
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            onKeyDown={() => {}}
            role="presentation"
          />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 flex flex-col gap-1 p-2 bg-[var(--game-parchment)] border-2 border-[var(--game-wood)] rounded-[var(--game-radius-lg)] shadow-[0_4px_16px_oklch(0.2_0.05_55/0.3)] animate-[scaleIn_0.15s_ease-out]">
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
                <button
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-[var(--game-radius-sm)] text-xs transition-all border whitespace-nowrap cursor-pointer',
                    isActive
                      ? 'bg-[var(--game-gold)] border-[var(--game-wood-dark)] text-[var(--game-text-heading)]'
                      : unlocked && canAfford
                        ? 'bg-[var(--game-parchment-light)] border-[var(--game-wood)]/30 text-[var(--game-text)] hover:bg-[var(--game-parchment-dark)]'
                        : 'opacity-40 cursor-not-allowed border-[var(--game-wood)]/20 text-[var(--game-text-muted)]'
                  )}
                  disabled={!unlocked || !canAfford}
                  key={def.id}
                  onClick={() => {
                    onSelect(isActive ? ('empty' as BuildingId) : def.id)
                    setOpen(false)
                  }}
                  type="button"
                >
                  <BIcon size={14} />
                  <span>{def.name}</span>
                  <span className="text-[9px] text-[var(--game-text-muted)]">
                    {footprintLabel}
                  </span>
                  {!unlocked && (
                    <span className="text-[9px] text-[var(--game-red)]">
                      未解锁
                    </span>
                  )}
                  <span
                    className={cn(
                      'ml-auto text-[10px]',
                      canAfford
                        ? 'text-[var(--game-green)]'
                        : 'text-[var(--game-red)]'
                    )}
                  >
                    ${def.cost}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
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
  const engine = useEngine()
  const milestones = useGameSelector(s => s.milestones, {
    keys: ['milestones'],
  })
  const selectedBuildingId = useGameSelector(s => s.selectedBuildingId, {
    keys: ['selectedBuildingId'],
  })
  const [roadMenuOpen, setRoadMenuOpen] = useState(false)
  const [terraformMenuOpen, setTerraformMenuOpen] = useState(false)

  const _demandIndicators = economy.demandIndicators
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
        {roadMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setRoadMenuOpen(false)}
              onKeyDown={() => {}}
              role="presentation"
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 flex flex-col gap-1 p-2 bg-[var(--game-parchment)] border-2 border-[var(--game-wood)] rounded-[var(--game-radius-lg)] shadow-[0_4px_16px_oklch(0.2_0.05_55/0.3)] animate-[scaleIn_0.15s_ease-out]">
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
                      engine.setSelectedBuildingId(null)
                      onSelectTool(type)
                      setRoadMenuOpen(false)
                    }}
                    type="button"
                  >
                    <RIcon size={14} />
                    <span>{TOOL_LABELS[type]}</span>
                    {terrainHint && (
                      <span className="text-[9px] text-[var(--game-text-muted)]">
                        {terrainHint}
                      </span>
                    )}
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
            {terraformMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setTerraformMenuOpen(false)}
                  onKeyDown={() => {}}
                  role="presentation"
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 flex flex-col gap-1 p-2 bg-[var(--game-parchment)] border-2 border-[var(--game-wood)] rounded-[var(--game-radius-lg)] shadow-[0_4px_16px_oklch(0.2_0.05_55/0.3)] animate-[scaleIn_0.15s_ease-out]">
                  {unlockedTerraformActions.map(action => {
                    const isActive = currentTool === action.tool
                    const canAfford = money >= action.cost
                    const TIcon = TOOL_ICONS[action.tool] ?? Mountain

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
                        key={action.tool}
                        onClick={() => {
                          onSelectTool(action.tool)
                          setTerraformMenuOpen(false)
                        }}
                        type="button"
                      >
                        <TIcon size={14} />
                        <span>{action.name}</span>
                        <span
                          className={cn(
                            'ml-auto text-[10px]',
                            canAfford
                              ? 'text-[var(--game-green)]'
                              : 'text-[var(--game-red)]'
                          )}
                        >
                          ${action.cost}
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
