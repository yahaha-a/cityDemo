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
}

/** 地图数据 */
export interface GameMap {
  width: number
  height: number
  tiles: Tile[][]
}

/** 游戏状态 */
export interface GameState {
  map: GameMap
  money: number
  currentTool: ToolType
  hoveredTile: { x: number; y: number } | null
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

/** 状态变更监听器类型 */
export type StateListener = () => void
