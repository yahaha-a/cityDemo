import type { GameMap, Camera, TimeState, ToolType } from './core'
import type { EconomyState } from './economy'
import type { EventState } from './events'
import type { MilestoneState } from './milestones'
import type { SynergyState } from './synergy'
import type { FacilityCoverageState } from './facilities'
import type { PolicyState } from './policies'
import type { ChallengeState } from './crisis'
import type { TechState } from './tech'
import type { SpecializationState } from './specialization'

/** 游戏状态 */
export interface GameState {
  map: GameMap
  money: number
  currentTool: ToolType
  hoveredTile: { x: number; y: number } | null
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
}

/** 存档数据结构 */
export interface SaveData {
  version: string
  timestamp: number
  name: string
  gameState: Omit<GameState, 'hoveredTile'>
}

/** 状态变更监听器类型 */
export type StateListener = () => void
