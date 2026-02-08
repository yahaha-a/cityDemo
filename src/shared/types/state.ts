import type { GameMap, Camera, TimeState, ToolType } from './core'
import type { BuildingId } from './building-defs'
import type { BuildingCategory } from './building-defs'
import type { BuildingEffectState } from './building-effects'
import type { EconomyState } from './economy'
import type { EventState } from './events'
import type { MilestoneState } from './milestones'
import type { PolicyState } from './policies'
import type { ChallengeState } from './crisis'
import type { TechState } from './tech'
import type { SpecializationState } from './specialization'
import type { StructureRegistry } from './structures'

/** 派生的地图统计数据（按需计算、缓存） */
export interface DerivedMapStats {
  buildingCounts: Record<BuildingId, number>
  categoryCounts: Record<BuildingCategory, number>
  roadCount: number
  emptyCount: number
  usagePercent: number
  connectionStats: { total: number; connected: number; disconnected: number }
}

/** 派生状态容器 */
export interface DerivedState {
  mapStats: DerivedMapStats | null
}

/** 游戏状态 */
export interface GameState {
  map: GameMap
  money: number
  currentTool: ToolType
  hoveredTile: { x: number; y: number } | null
  selectedBuildingId: BuildingId | null
  camera: Camera
  time: TimeState
  economy: EconomyState
  populationFloat: number
  mapSeed: number
  events: EventState
  milestones: MilestoneState
  policies: PolicyState
  challenge: ChallengeState
  tech: TechState
  specialization: SpecializationState
  structures: StructureRegistry
  buildingEffects: BuildingEffectState
  buildingRotation: number
  _derived: DerivedState
}

/** 存档数据结构 */
export interface SaveData {
  version: string
  timestamp: number
  name: string
  gameState: Omit<
    GameState,
    'hoveredTile' | 'selectedBuildingId' | 'buildingRotation' | '_derived'
  >
}

/** 状态变更监听器类型 */
export type StateListener = () => void
