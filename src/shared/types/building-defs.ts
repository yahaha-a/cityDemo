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

/** BuildingId → BuildingCategory 快速查询 */
const BUILDING_ID_CATEGORY: Record<BuildingId, BuildingCategory | null> = {
  empty: null,
  road: null,
  house: 'residential',
  apartment: 'residential',
  residential_complex: 'residential',
  shop: 'commercial',
  office: 'commercial',
  mall: 'commercial',
  factory: 'industrial',
  heavy_industry: 'industrial',
  warehouse: 'industrial',
  park: 'service',
  plaza: 'service',
  school: 'service',
  hospital: 'service',
  fire_station: 'service',
  police_station: 'service',
  power_plant: 'service',
}

/** 获取 BuildingId 的分类 */
export function buildingIdToCategory(id: BuildingId): BuildingCategory | null {
  return BUILDING_ID_CATEGORY[id]
}

/** 旋转 footprint（顺时针 90° × rotation 次） */
export function rotateFootprint(
  footprint: Array<{ dx: number; dy: number }>,
  rotation: number
): Array<{ dx: number; dy: number }> {
  const r = ((rotation % 4) + 4) % 4
  if (r === 0) return footprint
  return footprint.map(({ dx, dy }) => {
    let rdx = dx
    let rdy = dy
    for (let i = 0; i < r; i++) {
      const tmp = rdx
      rdx = -rdy
      rdy = tmp
    }
    return { dx: rdx, dy: rdy }
  })
}
