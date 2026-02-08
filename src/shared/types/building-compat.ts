/**
 * 建筑系统兼容层
 */
import type { BuildingId, BuildingCategory } from './building-defs'

/** 判断分类是否为产出资源类建筑（residential/commercial/industrial） */
export function isCoreCategory(category: BuildingCategory): boolean {
  return (
    category === 'residential' ||
    category === 'commercial' ||
    category === 'industrial'
  )
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

/** 快速获取 BuildingId 的分类（不依赖 TileType） */
export function buildingIdToCategory(id: BuildingId): BuildingCategory | null {
  return BUILDING_ID_CATEGORY[id]
}
