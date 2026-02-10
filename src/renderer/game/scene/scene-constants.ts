import { TerrainType } from 'shared/types'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'

/** 各地形类型的 Y 轴高度偏移 */
export const TERRAIN_Y_MAP: Record<TerrainType, number> = {
  [TerrainType.Plain]: 0,
  [TerrainType.Hill]: 0.15,
  [TerrainType.Water]: -0.08,
  [TerrainType.Fertile]: 0,
  [TerrainType.Rocky]: 0.05,
}

/** 地形基础块厚度 */
export const TERRAIN_THICKNESS = 0.1

/** 建筑底部偏移（地形厚度的一半） */
export const BUILDING_BASE_OFFSET = 0.05

/** 获取地形顶面 Y 坐标 */
export function getTerrainTopY(terrain: TerrainType): number {
  return (TERRAIN_Y_MAP[terrain] ?? 0) + BUILDING_BASE_OFFSET
}

/** 网格坐标 → 世界坐标 */
export function gridToWorld(
  x: number,
  y: number
): { wx: number; wz: number } {
  return {
    wx: x - MAP_WIDTH / 2 + 0.5,
    wz: y - MAP_HEIGHT / 2 + 0.5,
  }
}

/** 等级 → 高度倍率 */
export function getLevelHeightMult(level: number): number {
  if (level === 2) return 1.5
  if (level >= 3) return 2.2
  return 1
}

/** 断开道路连接时颜色缩放系数 */
export const DISCONNECTED_COLOR_SCALE = 0.4

/** 效率不足时灰度混合因子 */
export const EFFICIENCY_GRAY_FACTOR = 0.6

/** 悬停高亮白色 lerp 因子 */
export const HOVER_LERP_FACTOR = 0.35

/** 商业建筑日间窗户微光基准值 */
export const COMMERCIAL_BASE_EMISSIVE = 0.08
