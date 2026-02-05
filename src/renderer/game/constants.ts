import { TileType, type BuildingCosts } from 'shared/game-types'

/** 地图尺寸 */
export const MAP_WIDTH = 64
export const MAP_HEIGHT = 64

/** 瓦片尺寸 (等距 2:1 比例) */
export const TILE_WIDTH = 64
export const TILE_HEIGHT = 32

/** 初始资金 */
export const INITIAL_MONEY = 10000

/** 相机配置 */
export const CAMERA_MIN_ZOOM = 0.25
export const CAMERA_MAX_ZOOM = 2.0
export const CAMERA_ZOOM_SPEED = 0.1
export const CAMERA_PAN_SPEED = 10

/** 时间配置 (毫秒) */
export const DAY_DURATION_MS = 3000 // 一天持续 3 秒
export const TIME_SPEED_MULTIPLIERS = [0, 1, 3, 8] // 暂停/正常/快速/超快

/** 经济配置 */
export const INCOME_PER_RESIDENTIAL = 5 // 每个住宅每日收入
export const INCOME_PER_COMMERCIAL = 12 // 每个商业每日收入
export const INCOME_PER_INDUSTRIAL = 8 // 每个工业每日收入
export const POPULATION_PER_RESIDENTIAL = 4 // 每住宅提供的人口
export const ROAD_MAINTENANCE_COST = 1 // 每条道路每日维护费

/** 建筑成本 */
export const BUILDING_COSTS: BuildingCosts = {
  [TileType.Road]: 10,
  [TileType.Residential]: 100,
  [TileType.Commercial]: 150,
  [TileType.Industrial]: 200,
}

/** 建筑高度 (像素) */
export const BUILDING_HEIGHTS: Record<TileType, number> = {
  [TileType.Empty]: 0,
  [TileType.Road]: 0,
  [TileType.Residential]: 32,
  [TileType.Commercial]: 40,
  [TileType.Industrial]: 28,
}

/** 瓦片颜色 */
export const TILE_COLORS: Record<
  TileType,
  { top: string; left: string; right: string }
> = {
  [TileType.Empty]: {
    top: '#4ade80',
    left: '#22c55e',
    right: '#16a34a',
  },
  [TileType.Road]: {
    top: '#9ca3af',
    left: '#6b7280',
    right: '#4b5563',
  },
  [TileType.Residential]: {
    top: '#60a5fa',
    left: '#3b82f6',
    right: '#2563eb',
  },
  [TileType.Commercial]: {
    top: '#facc15',
    left: '#eab308',
    right: '#ca8a04',
  },
  [TileType.Industrial]: {
    top: '#f87171',
    left: '#ef4444',
    right: '#dc2626',
  },
}

/** 悬停高亮色 */
export const HOVER_COLOR = 'rgba(255, 255, 255, 0.3)'

/** 无效放置高亮色 */
export const INVALID_COLOR = 'rgba(255, 0, 0, 0.3)'

/** 拆除退款比例 */
export const DEMOLISH_REFUND_RATIO = 0.5

/** 工具显示名称 */
export const TOOL_LABELS: Record<string, string> = {
  select: '选择',
  road: '道路',
  residential: '住宅',
  commercial: '商业',
  industrial: '工业',
  demolish: '拆除',
}

/** 瓦片类型显示名称 */
export const TILE_LABELS: Record<TileType, string> = {
  [TileType.Empty]: '空地',
  [TileType.Road]: '道路',
  [TileType.Residential]: '住宅',
  [TileType.Commercial]: '商业',
  [TileType.Industrial]: '工业',
}
