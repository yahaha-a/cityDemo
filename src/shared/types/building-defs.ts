/**
 * 统一建筑定义类型
 */

/** 建筑 ID — 所有建筑的唯一标识 */
export type BuildingId =
  | 'empty'
  | 'road'
  | 'house'
  | 'apartment'
  | 'residential_complex'
  | 'shop'
  | 'office'
  | 'mall'
  | 'factory'
  | 'heavy_industry'
  | 'warehouse'
  | 'park'
  | 'plaza'
  | 'school'
  | 'hospital'
  | 'fire_station'
  | 'police_station'
  | 'power_plant'

/** 建筑分类 */
export type BuildingCategory =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'service'

/** 区域效果类型 */
export interface BuildingAreaEffect {
  type:
    | 'satisfaction'
    | 'income_multiplier'
    | 'efficiency_multiplier'
    | 'crisis_resistance'
    | 'capacity_multiplier'
    | 'research_points'
  value: number
  targetCategory?: BuildingCategory
}

/** 建筑定义 */
export interface BuildingDefinition {
  id: BuildingId
  name: string
  category: BuildingCategory
  footprint: Array<{ dx: number; dy: number }>
  cost: number
  maintenance: number
  maxLevel: number
  synergyTags: string[]
  produces: { labor?: number; goods?: number; services?: number }
  consumes: { labor?: number; goods?: number; services?: number }
  baseIncome: number
  areaEffects: BuildingAreaEffect[]
  areaRadius: number
  unlockCondition: { type: 'initial' | 'tech' | 'milestone'; id?: string }
}
