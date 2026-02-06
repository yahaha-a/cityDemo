import { TileType, TerrainType, type BuildingCosts } from 'shared/game-types'

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
  [TileType.Park]: 10,
  [TileType.School]: 36,
  [TileType.Hospital]: 44,
  [TileType.FireStation]: 32,
  [TileType.PoliceStation]: 32,
  [TileType.PowerPlant]: 48,
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
  [TileType.Park]: {
    top: '#34d399',
    left: '#10b981',
    right: '#059669',
  },
  [TileType.School]: {
    top: '#a78bfa',
    left: '#8b5cf6',
    right: '#7c3aed',
  },
  [TileType.Hospital]: {
    top: '#f9a8d4',
    left: '#f472b6',
    right: '#ec4899',
  },
  [TileType.FireStation]: {
    top: '#fb923c',
    left: '#f97316',
    right: '#ea580c',
  },
  [TileType.PoliceStation]: {
    top: '#67e8f9',
    left: '#22d3ee',
    right: '#06b6d4',
  },
  [TileType.PowerPlant]: {
    top: '#fbbf24',
    left: '#d97706',
    right: '#b45309',
  },
}

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
