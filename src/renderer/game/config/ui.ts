import { TileType, TerrainType } from 'shared/types'

/** 悬停高亮色 */
export const HOVER_COLOR = 'rgba(255, 255, 255, 0.3)'

/** 无效放置高亮色 */
export const INVALID_COLOR = 'rgba(255, 0, 0, 0.3)'

/** 工具显示名称 */
export const TOOL_LABELS: Record<string, string> = {
  select: '选择',
  road: '道路',
  residential: '住宅',
  commercial: '商业',
  industrial: '工业',
  park: '公园',
  school: '学校',
  hospital: '医院',
  fire_station: '消防局',
  police_station: '警察局',
  power_plant: '发电厂',
  demolish: '拆除',
  upgrade: '升级',
}

/** 瓦片类型显示名称 */
export const TILE_LABELS: Record<TileType, string> = {
  [TileType.Empty]: '空地',
  [TileType.Road]: '道路',
  [TileType.Residential]: '住宅',
  [TileType.Commercial]: '商业',
  [TileType.Industrial]: '工业',
  [TileType.Park]: '公园',
  [TileType.School]: '学校',
  [TileType.Hospital]: '医院',
  [TileType.FireStation]: '消防局',
  [TileType.PoliceStation]: '警察局',
  [TileType.PowerPlant]: '发电厂',
}

/** 地形中文名称 */
export const TERRAIN_LABELS: Record<TerrainType, string> = {
  [TerrainType.Plain]: '平原',
  [TerrainType.Hill]: '丘陵',
  [TerrainType.Water]: '水域',
  [TerrainType.Fertile]: '沃土',
  [TerrainType.Rocky]: '岩地',
}
