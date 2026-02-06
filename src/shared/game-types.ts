/**
 * 游戏核心类型定义
 */

/** 瓦片类型 */
export enum TileType {
  Empty = 'empty',
  Road = 'road',
  Residential = 'residential',
  Commercial = 'commercial',
  Industrial = 'industrial',
}

/** 地形类型 */
export enum TerrainType {
  Plain = 'plain',
  Hill = 'hill',
  Water = 'water',
  Fertile = 'fertile',
  Rocky = 'rocky',
}

/** 工具类型 */
export enum ToolType {
  Select = 'select',
  Road = 'road',
  Residential = 'residential',
  Commercial = 'commercial',
  Industrial = 'industrial',
  Demolish = 'demolish',
  Upgrade = 'upgrade',
}

/** 瓦片数据 */
export interface Tile {
  type: TileType
  x: number
  y: number
  level: number // 建筑等级，影响高度
  connected: boolean // 是否连接到道路网络
  terrain: TerrainType
}

/** 地图数据 */
export interface GameMap {
  width: number
  height: number
  tiles: Tile[][]
}

/** 相机状态 */
export interface Camera {
  x: number // 相机位置 (世界坐标)
  y: number
  zoom: number // 缩放级别 (0.25 - 2.0)
}

/** 时间速度 */
export enum TimeSpeed {
  Paused = 0,
  Normal = 1,
  Fast = 2,
  Ultra = 3,
}

/** 时间状态 */
export interface TimeState {
  day: number // 当前天数
  speed: TimeSpeed // 当前速度
  tickAccumulator: number // 用于时间累积
}

/** 资源供需快照 */
export interface ResourceBalance {
  supply: number
  demand: number
  ratio: number // min(supply/demand, 1)，demand=0 时为 1
}

/** 城市资源市场 */
export interface ResourceMarket {
  labor: ResourceBalance
  goods: ResourceBalance
  services: ResourceBalance
}

/** 需求等级（用于UI指示） */
export enum DemandLevel {
  Low = 'low',
  Balanced = 'balanced',
  High = 'high',
  Critical = 'critical',
}

/** 各建筑类别的需求指示 */
export interface DemandIndicators {
  residential: DemandLevel
  commercial: DemandLevel
  industrial: DemandLevel
}

/** 经济状态 */
export interface EconomyState {
  income: number // 每日收入
  expenses: number // 每日支出
  population: number // 人口
  lastDayRevenue: number // 上一天的净收入
  satisfaction: number // 0-100 满意度
  populationCapacity: number // 住宅容量上限
  resources: ResourceMarket
  demandIndicators: DemandIndicators
  efficiencyByType: {
    residential: number // 0-1
    commercial: number
    industrial: number
  }
}

// === 事件系统类型 ===

export type EventModifierTarget =
  | 'goodsDemandMultiplier'
  | 'servicesDemandMultiplier'
  | 'laborSupplyMultiplier'
  | 'incomeMultiplier'
  | 'roadMaintenanceMultiplier'
  | 'goodsSupplyMultiplier'
  | 'servicesSupplyMultiplier'
  | 'laborDemandMultiplier'

export interface GameEvent {
  id: string
  name: string
  description: string
  durationDays: number
  remainingDays: number
  modifiers: Array<{ target: EventModifierTarget; multiplier: number }>
}

export interface EventState {
  activeEvents: GameEvent[]
  eventCooldown: number
  eventHistory: string[] // 最近 N 个事件 ID，防重复
  unlockedEventIds: string[] // 里程碑解锁的额外事件
}

// === 里程碑系统类型 ===

export interface MilestoneCondition {
  type:
    | 'population'
    | 'satisfaction_streak'
    | 'total_income'
    | 'building_count'
    | 'day_reached'
  threshold: number
  buildingType?: TileType
  streakDays?: number
}

export interface MilestoneReward {
  type: 'bonus_money' | 'unlock_upgrade_lv3' | 'unlock_event'
  value?: number
  eventId?: string
}

export interface Milestone {
  id: string
  name: string
  description: string
  condition: MilestoneCondition
  reward: MilestoneReward
}

export interface MilestoneState {
  achieved: string[]
  satisfactionStreak: number
  cumulativeIncome: number
  upgradeLv3Unlocked: boolean
  pendingRewards: MilestoneReward[]
}

/** 游戏状态 */
export interface GameState {
  map: GameMap
  money: number
  currentTool: ToolType
  hoveredTile: { x: number; y: number } | null
  camera: Camera
  time: TimeState
  economy: EconomyState
  populationFloat: number // 人口增长小数累加器
  mapSeed: number
  events: EventState
  milestones: MilestoneState
}

/** 建筑成本配置 */
export interface BuildingCosts {
  [TileType.Road]: number
  [TileType.Residential]: number
  [TileType.Commercial]: number
  [TileType.Industrial]: number
}

/** 工具到瓦片类型的映射 */
export const toolToTileType: Partial<Record<ToolType, TileType>> = {
  [ToolType.Road]: TileType.Road,
  [ToolType.Residential]: TileType.Residential,
  [ToolType.Commercial]: TileType.Commercial,
  [ToolType.Industrial]: TileType.Industrial,
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
