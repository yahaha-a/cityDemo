/**
 * 核心游戏类型定义
 */

/** @deprecated 仅用于旧代码兼容，新代码使用 BuildingId */
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

/** 道路类型 */
export enum RoadType {
  Normal = 'normal',
  Highway = 'highway',
  Bridge = 'bridge',
  Tunnel = 'tunnel',
}

/** 工具类型 */
export enum ToolType {
  Select = 'select',
  Road = 'road',
  Highway = 'highway',
  Bridge = 'bridge',
  Tunnel = 'tunnel',
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
  FlattenTerrain = 'flatten_terrain',
  FillWater = 'fill_water',
  DigChannel = 'dig_channel',
  CreateHill = 'create_hill',
}

/** 瓦片数据 */
export interface Tile {
  buildingId: import('./building-defs').BuildingId
  x: number
  y: number
  level: number
  connected: boolean
  terrain: TerrainType
  roadType?: RoadType
  originalTerrain?: TerrainType
  structureId?: string
  structureRole?: 'origin' | 'part'
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

/** 工具 → BuildingId 映射（替代 toolToTileType） */
export const toolToBuildingId: Partial<
  Record<ToolType, import('./building-defs').BuildingId>
> = {
  [ToolType.Road]: 'road',
  [ToolType.Highway]: 'road',
  [ToolType.Bridge]: 'road',
  [ToolType.Tunnel]: 'road',
  [ToolType.Residential]: 'house',
  [ToolType.Commercial]: 'shop',
  [ToolType.Industrial]: 'factory',
  [ToolType.Park]: 'park',
  [ToolType.School]: 'school',
  [ToolType.Hospital]: 'hospital',
  [ToolType.FireStation]: 'fire_station',
  [ToolType.PoliceStation]: 'police_station',
  [ToolType.PowerPlant]: 'power_plant',
}

/** 设施 BuildingId 集合 */
export const FACILITY_BUILDING_IDS: ReadonlySet<
  import('./building-defs').BuildingId
> = new Set([
  'park',
  'plaza',
  'school',
  'hospital',
  'fire_station',
  'police_station',
  'power_plant',
])

export function isFacilityBuilding(
  id: import('./building-defs').BuildingId
): boolean {
  return FACILITY_BUILDING_IDS.has(id)
}

export function isEmptyOrRoad(
  id: import('./building-defs').BuildingId
): boolean {
  return id === 'empty' || id === 'road'
}

export function isBuildingId(
  id: import('./building-defs').BuildingId
): boolean {
  return id !== 'empty' && id !== 'road'
}

/** 道路工具到道路类型的映射 */
export const toolToRoadType: Partial<Record<ToolType, RoadType>> = {
  [ToolType.Road]: RoadType.Normal,
  [ToolType.Highway]: RoadType.Highway,
  [ToolType.Bridge]: RoadType.Bridge,
  [ToolType.Tunnel]: RoadType.Tunnel,
}

/** 判断工具是否为道路类型 */
export function isRoadTool(tool: ToolType): boolean {
  return tool in toolToRoadType
}

/** 地形改造工具集合 */
const TERRAFORM_TOOLS: ReadonlySet<ToolType> = new Set([
  ToolType.FlattenTerrain,
  ToolType.FillWater,
  ToolType.DigChannel,
  ToolType.CreateHill,
])

/** 判断工具是否为地形改造类型 */
export function isTerraformTool(tool: ToolType): boolean {
  return TERRAFORM_TOOLS.has(tool)
}
