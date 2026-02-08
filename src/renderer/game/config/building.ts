import { TerrainType } from 'shared/types'
import type { BuildingId } from 'shared/types/building-defs'

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

/** 拆除退款比例 */
export const DEMOLISH_REFUND_RATIO = 0.5

// === 建筑颜色（新建筑系统） ===

export const BUILDING_COLORS: Record<
  BuildingId,
  { base: string; accent: string }
> = {
  empty: { base: '#4ade80', accent: '#22c55e' },
  road: { base: '#9ca3af', accent: '#6b7280' },
  house: { base: '#60a5fa', accent: '#3b82f6' },
  apartment: { base: '#818cf8', accent: '#6366f1' },
  residential_complex: { base: '#a78bfa', accent: '#8b5cf6' },
  shop: { base: '#facc15', accent: '#eab308' },
  office: { base: '#fbbf24', accent: '#f59e0b' },
  mall: { base: '#f59e0b', accent: '#d97706' },
  factory: { base: '#f87171', accent: '#ef4444' },
  heavy_industry: { base: '#fb923c', accent: '#f97316' },
  warehouse: { base: '#d4d4d8', accent: '#a1a1aa' },
  park: { base: '#34d399', accent: '#10b981' },
  plaza: { base: '#fcd34d', accent: '#fbbf24' },
  school: { base: '#c084fc', accent: '#a855f7' },
  hospital: { base: '#f9a8d4', accent: '#f472b6' },
  fire_station: { base: '#fb923c', accent: '#ea580c' },
  police_station: { base: '#67e8f9', accent: '#06b6d4' },
  power_plant: { base: '#fde047', accent: '#facc15' },
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
