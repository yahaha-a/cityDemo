import {
  TileType,
  TerrainType,
  type BuildingCosts,
  type Milestone,
  type EventModifierTarget,
} from 'shared/game-types'

/** 地图尺寸 */
export const MAP_WIDTH = 64
export const MAP_HEIGHT = 64

/** 瓦片尺寸 (等距 2:1 比例) */
export const TILE_WIDTH = 64
export const TILE_HEIGHT = 32

/** 初始资金 */
export const INITIAL_MONEY = 10000

/** 相机配置 */
export const CAMERA_MIN_ZOOM = 0.25
export const CAMERA_MAX_ZOOM = 2.0
export const CAMERA_ZOOM_SPEED = 0.1
export const CAMERA_PAN_SPEED = 10

/** 时间配置 (毫秒) */
export const DAY_DURATION_MS = 3000 // 一天持续 3 秒
export const TIME_SPEED_MULTIPLIERS = [0, 1, 3, 8] // 暂停/正常/快速/超快

/** 经济配置 - 供需系统 */

// 人口容量
export const POP_CAPACITY_PER_RESIDENTIAL = 8

// 资源产出/消耗（每栋建筑每日）
export const LABOR_PER_POP = 1.0
export const SERVICES_DEMAND_PER_POP = 0.5

export const SERVICES_PER_COMMERCIAL = 6.0
export const GOODS_DEMAND_PER_COMMERCIAL = 4.0
export const LABOR_DEMAND_PER_COMMERCIAL = 3.0

export const GOODS_PER_INDUSTRIAL = 6.0
export const LABOR_DEMAND_PER_INDUSTRIAL = 4.0

// 收入（100%效率时）
export const BASE_RESIDENTIAL_TAX = 3
export const BASE_COMMERCIAL_INCOME = 15
export const BASE_INDUSTRIAL_INCOME = 10

// 人口动态
export const NEUTRAL_SATISFACTION = 50
export const MAX_GROWTH_RATE = 0.05
export const MAX_DECLINE_RATE = 0.03
export const SATISFACTION_SMOOTHING = 0.3
export const INITIAL_POP_SEED = 2

// 满意度权重（和为1）
export const SAT_WEIGHT_SERVICES = 0.35
export const SAT_WEIGHT_EMPLOYMENT = 0.3
export const SAT_WEIGHT_GOODS = 0.2
export const SAT_WEIGHT_BALANCE = 0.15

export const ROAD_MAINTENANCE_COST = 1 // 每条道路每日维护费

/** 建筑成本 */
export const BUILDING_COSTS: BuildingCosts = {
  [TileType.Road]: 10,
  [TileType.Residential]: 100,
  [TileType.Commercial]: 150,
  [TileType.Industrial]: 200,
}

/** 建筑高度 (像素) */
export const BUILDING_HEIGHTS: Record<TileType, number> = {
  [TileType.Empty]: 0,
  [TileType.Road]: 0,
  [TileType.Residential]: 32,
  [TileType.Commercial]: 40,
  [TileType.Industrial]: 28,
}

/** 瓦片颜色 */
export const TILE_COLORS: Record<
  TileType,
  { top: string; left: string; right: string }
> = {
  [TileType.Empty]: {
    top: '#4ade80',
    left: '#22c55e',
    right: '#16a34a',
  },
  [TileType.Road]: {
    top: '#9ca3af',
    left: '#6b7280',
    right: '#4b5563',
  },
  [TileType.Residential]: {
    top: '#60a5fa',
    left: '#3b82f6',
    right: '#2563eb',
  },
  [TileType.Commercial]: {
    top: '#facc15',
    left: '#eab308',
    right: '#ca8a04',
  },
  [TileType.Industrial]: {
    top: '#f87171',
    left: '#ef4444',
    right: '#dc2626',
  },
}

/** 悬停高亮色 */
export const HOVER_COLOR = 'rgba(255, 255, 255, 0.3)'

/** 无效放置高亮色 */
export const INVALID_COLOR = 'rgba(255, 0, 0, 0.3)'

/** 拆除退款比例 */
export const DEMOLISH_REFUND_RATIO = 0.5

/** 工具显示名称 */
export const TOOL_LABELS: Record<string, string> = {
  select: '选择',
  road: '道路',
  residential: '住宅',
  commercial: '商业',
  industrial: '工业',
  demolish: '拆除',
  upgrade: '升级',
}

/** 瓦片类型显示名称 */
export const TILE_LABELS: Record<TileType, string> = {
  [TileType.Empty]: '空地',
  [TileType.Road]: '道路',
  [TileType.Residential]: '住宅',
  [TileType.Commercial]: '商业',
  [TileType.Industrial]: '工业',
}

// === 地形系统常量 ===

/** 地形建造成本乘数 */
export const TERRAIN_BUILD_COST_MULTIPLIER: Record<TerrainType, number> = {
  [TerrainType.Plain]: 1,
  [TerrainType.Hill]: 2,
  [TerrainType.Water]: Number.POSITIVE_INFINITY,
  [TerrainType.Fertile]: 1,
  [TerrainType.Rocky]: 1.3,
}

/** 地形工业产出乘数 */
export const TERRAIN_INDUSTRIAL_OUTPUT_MULTIPLIER: Record<TerrainType, number> =
  {
    [TerrainType.Plain]: 1,
    [TerrainType.Hill]: 1,
    [TerrainType.Water]: 1,
    [TerrainType.Fertile]: 1.5,
    [TerrainType.Rocky]: 1,
  }

/** 水域相邻住宅满意度加成 */
export const WATER_ADJACENCY_SATISFACTION_BONUS = 3

/** 地形颜色 */
export const TERRAIN_COLORS: Record<
  TerrainType,
  { top: string; left: string; right: string }
> = {
  [TerrainType.Plain]: {
    top: '#4ade80',
    left: '#22c55e',
    right: '#16a34a',
  },
  [TerrainType.Hill]: {
    top: '#a8a29e',
    left: '#78716c',
    right: '#57534e',
  },
  [TerrainType.Water]: {
    top: '#38bdf8',
    left: '#0ea5e9',
    right: '#0284c7',
  },
  [TerrainType.Fertile]: {
    top: '#a3e635',
    left: '#84cc16',
    right: '#65a30d',
  },
  [TerrainType.Rocky]: {
    top: '#d6d3d1',
    left: '#a8a29e',
    right: '#78716c',
  },
}

/** 地形中文名称 */
export const TERRAIN_LABELS: Record<TerrainType, string> = {
  [TerrainType.Plain]: '平原',
  [TerrainType.Hill]: '丘陵',
  [TerrainType.Water]: '水域',
  [TerrainType.Fertile]: '沃土',
  [TerrainType.Rocky]: '岩地',
}

// === 建筑升级常量 ===

export const MAX_BUILDING_LEVEL = 3
export const LEVEL_CAPACITY_MULTIPLIER = [1, 1.8, 3.0]
export const LEVEL_OUTPUT_MULTIPLIER = [1, 1.8, 3.0]
export const LEVEL_DEMAND_MULTIPLIER = [1, 1.5, 2.2]
export const LEVEL_INCOME_MULTIPLIER = [1, 2.0, 3.5]
/** 升级到 Lv N 的成本 = baseCost × 此值 */
export const UPGRADE_COST_MULTIPLIER = [0, 1.5, 3.0]
export const UPGRADE_MIN_EFFICIENCY = 0.6
export const LEVEL_HEIGHT_MULTIPLIER = [1, 1.5, 2.2]

// === 事件系统常量 ===

export const EVENT_BASE_COOLDOWN = 30
export const EVENT_COOLDOWN_VARIANCE = 10
export const EVENT_HISTORY_SIZE = 3

export interface EventTemplate {
  id: string
  name: string
  description: string
  minDay: number
  durationMin: number
  durationMax: number
  modifiers: Array<{ target: EventModifierTarget; multiplier: number }>
  unlockedByDefault: boolean
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: 'trade_boom',
    name: '贸易繁荣',
    description: '商品需求暴增，商业利润翻倍',
    minDay: 10,
    durationMin: 8,
    durationMax: 12,
    modifiers: [
      { target: 'goodsDemandMultiplier', multiplier: 1.5 },
      { target: 'incomeMultiplier', multiplier: 1.3 },
    ],
    unlockedByDefault: true,
  },
  {
    id: 'labor_shortage',
    name: '劳动力短缺',
    description: '工人罢工，劳动力供给减少',
    minDay: 15,
    durationMin: 8,
    durationMax: 15,
    modifiers: [{ target: 'laborSupplyMultiplier', multiplier: 0.7 }],
    unlockedByDefault: true,
  },
  {
    id: 'road_decay',
    name: '道路老化',
    description: '基础设施维护费用激增',
    minDay: 20,
    durationMin: 10,
    durationMax: 15,
    modifiers: [{ target: 'roadMaintenanceMultiplier', multiplier: 2.5 }],
    unlockedByDefault: true,
  },
  {
    id: 'industrial_boom',
    name: '工业革命',
    description: '新技术提升工业产出',
    minDay: 25,
    durationMin: 10,
    durationMax: 15,
    modifiers: [{ target: 'goodsSupplyMultiplier', multiplier: 1.5 }],
    unlockedByDefault: true,
  },
  {
    id: 'service_demand',
    name: '服务热潮',
    description: '市民对服务需求大增',
    minDay: 15,
    durationMin: 8,
    durationMax: 12,
    modifiers: [{ target: 'servicesDemandMultiplier', multiplier: 1.5 }],
    unlockedByDefault: true,
  },
  {
    id: 'golden_age',
    name: '黄金时代',
    description: '城市进入繁荣期，收入大幅增长',
    minDay: 50,
    durationMin: 10,
    durationMax: 15,
    modifiers: [
      { target: 'incomeMultiplier', multiplier: 2.0 },
      { target: 'laborSupplyMultiplier', multiplier: 1.2 },
    ],
    unlockedByDefault: false,
  },
  {
    id: 'economic_crisis',
    name: '经济危机',
    description: '全面衰退，所有供给下降',
    minDay: 60,
    durationMin: 10,
    durationMax: 15,
    modifiers: [
      { target: 'goodsSupplyMultiplier', multiplier: 0.6 },
      { target: 'servicesSupplyMultiplier', multiplier: 0.6 },
      { target: 'incomeMultiplier', multiplier: 0.5 },
    ],
    unlockedByDefault: false,
  },
]

// === 里程碑系统常量 ===

export const SATISFACTION_STREAK_THRESHOLD = 70

export const MILESTONES: Milestone[] = [
  {
    id: 'pop_50',
    name: '初具规模',
    description: '人口达到 50',
    condition: { type: 'population', threshold: 50 },
    reward: { type: 'bonus_money', value: 500 },
  },
  {
    id: 'pop_100',
    name: '小镇崛起',
    description: '人口达到 100',
    condition: { type: 'population', threshold: 100 },
    reward: { type: 'bonus_money', value: 1500 },
  },
  {
    id: 'pop_300',
    name: '城市雏形',
    description: '人口达到 300',
    condition: { type: 'population', threshold: 300 },
    reward: { type: 'bonus_money', value: 5000 },
  },
  {
    id: 'happy_7',
    name: '安居乐业',
    description: '满意度连续 7 天 >=70',
    condition: { type: 'satisfaction_streak', threshold: 70, streakDays: 7 },
    reward: { type: 'unlock_upgrade_lv3' },
  },
  {
    id: 'happy_14',
    name: '幸福之城',
    description: '满意度连续 14 天 >=70',
    condition: { type: 'satisfaction_streak', threshold: 70, streakDays: 14 },
    reward: { type: 'unlock_event', eventId: 'golden_age' },
  },
  {
    id: 'income_5000',
    name: '日进斗金',
    description: '累计收入达到 5000',
    condition: { type: 'total_income', threshold: 5000 },
    reward: { type: 'bonus_money', value: 2000 },
  },
  {
    id: 'income_20000',
    name: '富甲一方',
    description: '累计收入达到 20000',
    condition: { type: 'total_income', threshold: 20000 },
    reward: { type: 'unlock_event', eventId: 'economic_crisis' },
  },
  {
    id: 'buildings_20',
    name: '建筑大师',
    description: '拥有 20 栋建筑（不含道路）',
    condition: { type: 'building_count', threshold: 20 },
    reward: { type: 'bonus_money', value: 1000 },
  },
  {
    id: 'day_50',
    name: '半百之城',
    description: '城市存续 50 天',
    condition: { type: 'day_reached', threshold: 50 },
    reward: { type: 'bonus_money', value: 3000 },
  },
  {
    id: 'day_100',
    name: '百日庆典',
    description: '城市存续 100 天',
    condition: { type: 'day_reached', threshold: 100 },
    reward: { type: 'bonus_money', value: 8000 },
  },
]
