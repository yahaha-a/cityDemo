import type { GameMap, Camera, TimeState, ToolType, TileType } from './core'
import type { EconomyState } from './economy'
import type { EventState } from './events'
import type { MilestoneState } from './milestones'
import type { SynergyState } from './synergy'
import type { FacilityCoverageState } from './facilities'
import type { PolicyState } from './policies'
import type { ChallengeState } from './crisis'
import type { TechState } from './tech'
import type { SpecializationState } from './specialization'
import type { StructureRegistry } from './structures'
import type { ProductionChainState } from './production'

/** 派生的地图统计数据（按需计算、缓存） */
export interface DerivedMapStats {
  tileCounts: Record<TileType, number>
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
  selectedStructureTemplate: string | null
  camera: Camera
  time: TimeState
  economy: EconomyState
  populationFloat: number
  mapSeed: number
  events: EventState
  milestones: MilestoneState
  synergy: SynergyState
  facilities: FacilityCoverageState
  policies: PolicyState
  challenge: ChallengeState
  tech: TechState
  specialization: SpecializationState
  structures: StructureRegistry
  productionChains: ProductionChainState
  _derived: DerivedState
}

/** 存档数据结构 */
export interface SaveData {
  version: string
  timestamp: number
  name: string
  gameState: Omit<
    GameState,
    'hoveredTile' | 'selectedStructureTemplate' | '_derived'
  >
}

/** 状态变更监听器类型 */
export type StateListener = () => void
