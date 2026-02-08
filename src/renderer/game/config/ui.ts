import { TerrainType } from 'shared/types'
import type { BuildingId } from 'shared/types/building-defs'

/** 悬停高亮色 */
export const HOVER_COLOR = 'rgba(255, 255, 255, 0.3)'

/** 无效放置高亮色 */
export const INVALID_COLOR = 'rgba(255, 0, 0, 0.3)'

/** 工具显示名称 */
export const TOOL_LABELS: Record<string, string> = {
  select: '选择',
  road: '普通道路',
  highway: '高速公路',
  bridge: '桥梁',
  tunnel: '隧道',
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
  flatten_terrain: '平整地形',
  fill_water: '填水造陆',
  dig_channel: '开挖水道',
  create_hill: '堆土造丘',
}

/** 地形中文名称 */
export const TERRAIN_LABELS: Record<TerrainType, string> = {
  [TerrainType.Plain]: '平原',
  [TerrainType.Hill]: '丘陵',
  [TerrainType.Water]: '水域',
  [TerrainType.Fertile]: '沃土',
  [TerrainType.Rocky]: '岩地',
}

/** BuildingId 显示名称 */
export const BUILDING_LABELS: Record<BuildingId, string> = {
  empty: '空地',
  road: '道路',
  house: '住宅',
  apartment: '公寓',
  residential_complex: '住宅综合体',
  shop: '商店',
  office: '办公楼',
  mall: '商场',
  factory: '工厂',
  heavy_industry: '重工业',
  warehouse: '仓库',
  park: '公园',
  plaza: '广场',
  school: '学校',
  hospital: '医院',
  fire_station: '消防局',
  police_station: '警察局',
  power_plant: '发电厂',
}
