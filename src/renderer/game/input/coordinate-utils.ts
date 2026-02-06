import { TILE_WIDTH, TILE_HEIGHT, MAP_WIDTH, MAP_HEIGHT } from '../constants'
import type { Camera } from 'shared/game-types'

/**
 * 网格坐标 -> 屏幕坐标 (考虑相机)
 */
export function gridToScreen(
  gridX: number,
  gridY: number,
  originX: number,
  originY: number,
  camera?: Camera
): { x: number; y: number } {
  const zoom = camera?.zoom ?? 1
  const camX = camera?.x ?? 0
  const camY = camera?.y ?? 0

  // 先计算世界坐标
  const worldX = (gridX - gridY) * (TILE_WIDTH / 2)
  const worldY = (gridX + gridY) * (TILE_HEIGHT / 2)

  // 应用相机偏移和缩放
  return {
    x: originX + (worldX - camX) * zoom,
    y: originY + (worldY - camY) * zoom,
  }
}

/**
 * 屏幕坐标 -> 网格坐标 (考虑相机)
 */
export function screenToGrid(
  screenX: number,
  screenY: number,
  originX: number,
  originY: number,
  camera?: Camera
): { x: number; y: number } {
  const zoom = camera?.zoom ?? 1
  const camX = camera?.x ?? 0
  const camY = camera?.y ?? 0

  // 先转换为世界坐标
  const worldX = (screenX - originX) / zoom + camX
  const worldY = (screenY - originY) / zoom + camY

  const halfW = TILE_WIDTH / 2
  const halfH = TILE_HEIGHT / 2

  const gx = (worldX / halfW + worldY / halfH) / 2
  const gy = (worldY / halfH - worldX / halfW) / 2

  return {
    x: Math.floor(gx),
    y: Math.floor(gy),
  }
}

/**
 * 检查网格坐标是否在地图范围内
 */
export function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT
}

/**
 * 计算地图原点 (画布中心)
 */
export function calculateOrigin(
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: canvasWidth / 2,
    y: canvasHeight / 2,
  }
}
