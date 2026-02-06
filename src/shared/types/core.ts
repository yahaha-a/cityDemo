/**
 * 核心游戏类型定义
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
  level: number
  connected: boolean
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
  x: number
  y: number
  zoom: number
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
  day: number
  speed: TimeSpeed
  tickAccumulator: number
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

/** 建筑成本配置 */
export interface BuildingCosts {
  [TileType.Road]: number
  [TileType.Residential]: number
  [TileType.Commercial]: number
  [TileType.Industrial]: number
}
