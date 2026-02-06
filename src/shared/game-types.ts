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
  Park = 'park',
  School = 'school',
  Hospital = 'hospital',
  FireStation = 'fire_station',
  PoliceStation = 'police_station',
  PowerPlant = 'power_plant',
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
  Park = 'park',
  School = 'school',
  Hospital = 'hospital',
  FireStation = 'fire_station',
  PoliceStation = 'police_station',
  PowerPlant = 'power_plant',
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

// === 邻接协同系统类型 ===

export interface SynergyEffect {
  type: 'satisfaction' | 'income_multiplier' | 'efficiency_multiplier'
  value: number
}

export interface SynergyRule {
  id: string
  sourceTileType: TileType
  targetTileType: TileType
  radius: number
  effect: SynergyEffect
  maxStacks: number
}

export interface TileSynergyInfo {
  satisfactionMod: number
  incomeMultiplier: number
  efficiencyMultiplier: number
  sources: Array<{ ruleId: string; stacks: number }>
}

export interface SynergyState {
  tileEffects: Record<string, TileSynergyInfo>
  globalSatisfactionMod: number
  incomeMultByType: {
    residential: number
    commercial: number
    industrial: number
  }
  effMultByType: { residential: number; commercial: number; industrial: number }
}

// === 区域设施系统类型 ===

export interface FacilityEffect {
  type:
    | 'satisfaction'
    | 'income_multiplier'
    | 'efficiency_multiplier'
    | 'crisis_resistance'
    | 'capacity_multiplier'
    | 'research_points'
  value: number
  targetTileType?: TileType
}

export interface FacilityTemplate {
  tileType: TileType
  name: string
  buildCost: number
  maintenanceCost: number
  radius: number
  effects: FacilityEffect[]
  unlockTech?: string
}

export interface FacilityCoverageInfo {
  satisfactionMod: number
  incomeMultiplier: number
  efficiencyMultiplier: number
  crisisResistance: number
  capacityMultiplier: number
  researchPoints: number
  facilities: TileType[]
}

export interface FacilityCoverageState {
  coverage: Record<string, FacilityCoverageInfo>
  totalMaintenance: number
  totalResearchPoints: number
  avgCrisisResistance: number
}

// === 政策系统类型 ===

export interface PolicyEffect {
  type:
    | 'income_multiplier'
    | 'satisfaction'
    | 'growth_multiplier'
    | 'expense_multiplier'
    | 'industrial_multiplier'
    | 'commercial_multiplier'
    | 'capacity_multiplier'
    | 'research_multiplier'
    | 'road_maintenance_multiplier'
    | 'build_cost_multiplier'
    | 'crisis_frequency_multiplier'
  value: number
}

export interface PolicyTemplate {
  id: string
  name: string
  category: string
  effects: PolicyEffect[]
  exclusiveWith: string[]
  cooldownDays: number
  unlockTech?: string
}

export interface PolicyState {
  activePolicies: string[]
  cooldowns: Record<string, number>
  unlockedPolicies: string[]
}

// === 危机系统类型 ===

export interface CrisisEffect {
  type:
    | 'money'
    | 'satisfaction'
    | 'income_multiplier_temp'
    | 'industrial_multiplier_temp'
    | 'services_multiplier_temp'
    | 'population_loss'
    | 'prevent_chain'
  value: number
  durationDays?: number
}

export interface CrisisOption {
  id: string
  label: string
  description: string
  cost: number
  effects: CrisisEffect[]
  requirements?: { facility?: TileType; tech?: string }
}

export interface CrisisTemplate {
  id: string
  name: string
  description: string
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic'
  options: CrisisOption[]
  chainEventId?: string
  chainProbability?: number
  preventedByFacilities?: TileType[]
  preventionThreshold?: number
  minDay: number
  baseProbability: number
}

export interface ActiveCrisis {
  templateId: string
  name: string
  severity: string
  remainingEffects: Array<{
    type: string
    value: number
    remainingDays: number
  }>
}

export interface ChallengeState {
  challengeMode: boolean
  pendingCrisis: CrisisTemplate | null
  activeCrises: ActiveCrisis[]
  deficitDays: number
  lowSatisfactionDays: number
  gameOver: boolean
  gameWon: boolean
  winProgress: number
  score: number
}

// === 科技树类型 ===

export interface TechEffect {
  type:
    | 'unlock_building'
    | 'unlock_policy'
    | 'permanent_multiplier'
    | 'unlock_specialization'
    | 'increase_synergy_radius'
    | 'research_multiplier'
  value?: number
  target?: string
}

export interface TechNode {
  id: string
  name: string
  description: string
  tier: number
  rpCost: number
  effects: TechEffect[]
  prerequisites: string[]
}

export interface TechState {
  researched: string[]
  currentResearch: string | null
  researchProgress: number
  dailyRP: number
  unlockedBuildings: TileType[]
  unlockedPolicies: string[]
  unlockedSpecializations: string[]
  permanentMultipliers: Record<string, number>
}

// === 城市特色类型 ===

export interface SpecializationEffect {
  type:
    | 'industrial_multiplier'
    | 'commercial_multiplier'
    | 'satisfaction'
    | 'capacity_multiplier'
    | 'income_multiplier'
    | 'build_cost_multiplier'
    | 'research_multiplier'
    | 'all_production_multiplier'
    | 'all_cost_multiplier'
  value: number
}

export interface SpecializationTemplate {
  id: string
  name: string
  description: string
  effects: SpecializationEffect[]
  unlockTech: string
}

export interface SpecializationState {
  chosen: string | null
  available: string[]
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
  synergy: SynergyState
  facilities: FacilityCoverageState
  policies: PolicyState
  challenge: ChallengeState
  tech: TechState
  specialization: SpecializationState
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
  [ToolType.Park]: TileType.Park,
  [ToolType.School]: TileType.School,
  [ToolType.Hospital]: TileType.Hospital,
  [ToolType.FireStation]: TileType.FireStation,
  [ToolType.PoliceStation]: TileType.PoliceStation,
  [ToolType.PowerPlant]: TileType.PowerPlant,
}

/** 设施类型集合 */
export const FACILITY_TILE_TYPES: ReadonlySet<TileType> = new Set([
  TileType.Park,
  TileType.School,
  TileType.Hospital,
  TileType.FireStation,
  TileType.PoliceStation,
  TileType.PowerPlant,
])

/** 判断瓦片类型是否为设施 */
export function isFacilityType(type: TileType): boolean {
  return FACILITY_TILE_TYPES.has(type)
}

/** 判断瓦片类型是否为核心建筑（住宅/商业/工业） */
export function isCoreBuilding(type: TileType): boolean {
  return (
    type === TileType.Residential ||
    type === TileType.Commercial ||
    type === TileType.Industrial
  )
}

/** 判断瓦片类型是否为任何建筑（含设施） */
export function isBuilding(type: TileType): boolean {
  return type !== TileType.Empty && type !== TileType.Road
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
