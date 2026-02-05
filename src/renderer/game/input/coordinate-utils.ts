import { TILE_WIDTH, TILE_HEIGHT, MAP_WIDTH, MAP_HEIGHT } from '../constants'

/**
 * 网格坐标 -> 屏幕坐标
 */
export function gridToScreen(
  gridX: number,
  gridY: number,
  originX: number,
  originY: number
): { x: number; y: number } {
  return {
    x: originX + (gridX - gridY) * (TILE_WIDTH / 2),
    y: originY + (gridX + gridY) * (TILE_HEIGHT / 2),
  }
}

/**
 * 屏幕坐标 -> 网格坐标
 */
export function screenToGrid(
  screenX: number,
  screenY: number,
  originX: number,
  originY: number
): { x: number; y: number } {
  const sx = screenX - originX
  const sy = screenY - originY

  const halfW = TILE_WIDTH / 2
  const halfH = TILE_HEIGHT / 2

  const gx = (sx / halfW + sy / halfH) / 2
  const gy = (sy / halfH - sx / halfW) / 2

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
 * 计算地图原点 (使地图居中)
 */
export function calculateOrigin(
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: canvasWidth / 2,
    y:
      canvasHeight / 2 -
      ((MAP_WIDTH + MAP_HEIGHT) * (TILE_HEIGHT / 2)) / 2 +
      TILE_HEIGHT,
  }
}
