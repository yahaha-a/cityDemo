/**
 * 建筑系统兼容层 — 旧 TileType ↔ 新 BuildingId 映射
 */
import { TileType, type Tile } from './core'
import type { BuildingId, BuildingCategory } from './building-defs'

/** 旧 TileType → 新 BuildingId（1x1 建筑对应） */
export const TILE_TYPE_TO_BUILDING_ID: Record<TileType, BuildingId> = {
  [TileType.Empty]: 'empty',
  [TileType.Road]: 'road',
  [TileType.Residential]: 'house',
  [TileType.Commercial]: 'shop',
  [TileType.Industrial]: 'factory',
  [TileType.Park]: 'park',
  [TileType.School]: 'school',
  [TileType.Hospital]: 'hospital',
  [TileType.FireStation]: 'fire_station',
  [TileType.PoliceStation]: 'police_station',
  [TileType.PowerPlant]: 'power_plant',
}

/** 新 BuildingId → 旧 TileType（多格建筑映射到对应分类的 TileType） */
export const BUILDING_ID_TO_TILE_TYPE: Record<BuildingId, TileType> = {
  empty: TileType.Empty,
  road: TileType.Road,
  house: TileType.Residential,
  apartment: TileType.Residential,
  residential_complex: TileType.Residential,
  shop: TileType.Commercial,
  office: TileType.Commercial,
  mall: TileType.Commercial,
  factory: TileType.Industrial,
  heavy_industry: TileType.Industrial,
  warehouse: TileType.Industrial,
  park: TileType.Park,
  plaza: TileType.Park,
  school: TileType.School,
  hospital: TileType.Hospital,
  fire_station: TileType.FireStation,
  police_station: TileType.PoliceStation,
  power_plant: TileType.PowerPlant,
}

/** 获取格子的 BuildingId — 优先返回 buildingId，回退到映射 */
export function getTileBuildingId(tile: Tile): BuildingId {
  if (tile.buildingId) return tile.buildingId
  return TILE_TYPE_TO_BUILDING_ID[tile.type]
}

/** BuildingCategory → 对应的核心 TileType 列表 */
const CATEGORY_TILE_TYPES: Record<BuildingCategory, TileType[]> = {
  residential: [TileType.Residential],
  commercial: [TileType.Commercial],
  industrial: [TileType.Industrial],
  service: [
    TileType.Park,
    TileType.School,
    TileType.Hospital,
    TileType.FireStation,
    TileType.PoliceStation,
    TileType.PowerPlant,
  ],
}

/** 判断分类是否为产出资源类建筑（residential/commercial/industrial） */
export function isCoreCategory(category: BuildingCategory): boolean {
  return (
    category === 'residential' ||
    category === 'commercial' ||
    category === 'industrial'
  )
}

/** 根据 TileType 获取 BuildingCategory */
export function tileTypeToCategory(type: TileType): BuildingCategory | null {
  for (const [cat, types] of Object.entries(CATEGORY_TILE_TYPES)) {
    if (types.includes(type)) return cat as BuildingCategory
  }
  return null
}
