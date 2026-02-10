import { TerrainType } from 'shared/types'
import type { BuildingId, BuildingCategory } from 'shared/types/building-defs'

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
  { base: string; accent: string; window: string }
> = {
  empty: { base: '#88dca0', accent: '#60c480', window: '#88dca0' },
  road: { base: '#d8cfc0', accent: '#b8b0a0', window: '#d8cfc0' },
  // 住宅: 暖奶油色→赤陶色系
  house: { base: '#f0d888', accent: '#d06848', window: '#b8d8e8' },
  apartment: { base: '#e8c878', accent: '#c85838', window: '#a8c8d8' },
  residential_complex: {
    base: '#e0b868',
    accent: '#b84828',
    window: '#98b8c8',
  },
  // 商业: 金色-琥珀色系
  shop: { base: '#f0d060', accent: '#d89830', window: '#c8e0e8' },
  office: { base: '#c8d8a0', accent: '#90a868', window: '#b0d0e0' },
  mall: { base: '#e8c060', accent: '#c08030', window: '#b8d0d8' },
  // 工业: 橄榄绿-钢灰色系
  factory: { base: '#98b088', accent: '#709060', window: '#90a8b0' },
  heavy_industry: { base: '#909898', accent: '#707878', window: '#889098' },
  warehouse: { base: '#c0b090', accent: '#a09070', window: '#98a8a8' },
  // 服务: 每种建筑独特标志色
  park: { base: '#80d068', accent: '#58b040', window: '#80d068' },
  plaza: { base: '#e0d098', accent: '#c0a870', window: '#e0d098' },
  school: { base: '#b090d0', accent: '#8868b0', window: '#a0c0d0' },
  hospital: { base: '#f0d8d0', accent: '#e08888', window: '#b0d0e0' },
  fire_station: { base: '#e07850', accent: '#c05028', window: '#a0b8c0' },
  police_station: { base: '#6898c8', accent: '#4878a8', window: '#98b8d0' },
  power_plant: { base: '#d8b850', accent: '#b89028', window: '#90a8a8' },
}

/** 夜间窗户发光颜色，按建筑类别 */
export const WINDOW_GLOW_COLORS: Record<BuildingCategory, string> = {
  residential: '#ffd888',
  commercial: '#fff0c0',
  industrial: '#e8a840',
  service: '#d0e8ff',
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
