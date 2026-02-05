/**
 * 游戏核心类型定义
 */

/** 瓦片类型 */
export enum TileType {
  Empty = 'empty',
  Road = 'road',
  Residential = 'residential',
  Commercial = 'commercial',
  Industrial = 'industrial',
}

/** 工具类型 */
export enum ToolType {
  Select = 'select',
  Road = 'road',
  Residential = 'residential',
  Commercial = 'commercial',
  Industrial = 'industrial',
  Demolish = 'demolish',
}

/** 瓦片数据 */
export interface Tile {
  type: TileType
  x: number
  y: number
  level: number // 建筑等级，影响高度
  connected: boolean // 是否连接到道路网络
}

/** 地图数据 */
export interface GameMap {
  width: number
  height: number
  tiles: Tile[][]
}

/** 相机状态 */
export interface Camera {
  x: number // 相机位置 (世界坐标)
  y: number
  zoom: number // 缩放级别 (0.25 - 2.0)
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
  day: number // 当前天数
  speed: TimeSpeed // 当前速度
  tickAccumulator: number // 用于时间累积
}

/** 经济状态 */
export interface EconomyState {
  income: number // 每日收入
  expenses: number // 每日支出
  population: number // 人口
  lastDayRevenue: number // 上一天的净收入
}

/** 游戏状态 */
export interface GameState {
  map: GameMap
  money: number
  currentTool: ToolType
  hoveredTile: { x: number; y: number } | null
  camera: Camera
  time: TimeState
  economy: EconomyState
}

/** 建筑成本配置 */
export interface BuildingCosts {
  [TileType.Road]: number
  [TileType.Residential]: number
  [TileType.Commercial]: number
  [TileType.Industrial]: number
}

/** 工具到瓦片类型的映射 */
export const toolToTileType: Partial<Record<ToolType, TileType>> = {
  [ToolType.Road]: TileType.Road,
  [ToolType.Residential]: TileType.Residential,
  [ToolType.Commercial]: TileType.Commercial,
  [ToolType.Industrial]: TileType.Industrial,
}

/** 存档数据结构 */
export interface SaveData {
  version: string
  timestamp: number
  name: string
  gameState: Omit<GameState, 'hoveredTile'>
}

/** 状态变更监听器类型 */
export type StateListener = () => void
