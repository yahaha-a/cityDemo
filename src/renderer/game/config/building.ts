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
    top: '#88dca0',
    left: '#60c480',
    right: '#50b070',
  },
  [TerrainType.Hill]: {
    top: '#c8b8a0',
    left: '#b09880',
    right: '#987860',
  },
  [TerrainType.Water]: {
    top: '#70c8e0',
    left: '#50b8d8',
    right: '#38a0c0',
  },
  [TerrainType.Fertile]: {
    top: '#b8e86a',
    left: '#98d048',
    right: '#80b838',
  },
  [TerrainType.Rocky]: {
    top: '#d8d0c0',
    left: '#c0b0a0',
    right: '#a89880',
  },
}

/** 拆除退款比例 */
export const DEMOLISH_REFUND_RATIO = 0.5

// === 建筑颜色（新建筑系统） ===

export const BUILDING_COLORS: Record<
  BuildingId,
  { base: string; accent: string }
> = {
  empty: { base: '#88dca0', accent: '#60c480' },
  road: { base: '#d8cfc0', accent: '#b8b0a0' },
  house: { base: '#e8d080', accent: '#c06848' },
  apartment: { base: '#e0c070', accent: '#b85840' },
  residential_complex: { base: '#d8b060', accent: '#a84830' },
  shop: { base: '#e8c858', accent: '#c09030' },
  office: { base: '#b8c890', accent: '#889860' },
  mall: { base: '#e0b868', accent: '#b87838' },
  factory: { base: '#90a880', accent: '#688858' },
  heavy_industry: { base: '#889088', accent: '#687068' },
  warehouse: { base: '#b8a888', accent: '#988868' },
  park: { base: '#78c860', accent: '#50a038' },
  plaza: { base: '#d8c890', accent: '#b8a068' },
  school: { base: '#a088c0', accent: '#7860a0' },
  hospital: { base: '#e8d0c8', accent: '#d08080' },
  fire_station: { base: '#d87850', accent: '#b85030' },
  police_station: { base: '#6090b8', accent: '#407098' },
  power_plant: { base: '#d0b048', accent: '#b08828' },
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
