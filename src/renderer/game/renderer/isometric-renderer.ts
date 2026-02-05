import type { GameState, Tile, Camera } from 'shared/game-types'
import { TileType, ToolType, toolToTileType } from 'shared/game-types'
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  TILE_COLORS,
  BUILDING_HEIGHTS,
  HOVER_COLOR,
  INVALID_COLOR,
  BUILDING_COSTS,
} from '../constants'
import {
  gridToScreen,
  calculateOrigin,
  isInBounds,
} from '../input/coordinate-utils'

/**
 * 等距渲染引擎
 */
export class IsometricRenderer {
  private ctx: CanvasRenderingContext2D
  private canvas: HTMLCanvasElement
  private originX = 0
  private originY = 0
  private dimColorCache = new Map<string, string>()

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2d context')
    this.ctx = ctx
    this.updateOrigin()
  }

  updateOrigin(): void {
    const origin = calculateOrigin(this.canvas.width, this.canvas.height)
    this.originX = origin.x
    this.originY = origin.y
  }

  getOrigin(): { x: number; y: number } {
    return { x: this.originX, y: this.originY }
  }

  resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
    this.updateOrigin()
  }

  render(state: GameState): void {
    this.clear()
    this.renderMap(state)
    this.renderHover(state)
    this.renderCameraInfo(state.camera)
  }

  private clear(): void {
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private renderMap(state: GameState): void {
    const { map, camera } = state
    const zoom = camera.zoom

    // 计算可见区域边界（优化渲染性能）
    const margin = 2
    const viewBounds = this.getVisibleBounds(camera)

    // 从后往前渲染，确保遮挡正确
    for (
      let y = Math.max(0, viewBounds.minY - margin);
      y <= Math.min(map.height - 1, viewBounds.maxY + margin);
      y++
    ) {
      for (
        let x = Math.max(0, viewBounds.minX - margin);
        x <= Math.min(map.width - 1, viewBounds.maxX + margin);
        x++
      ) {
        const tile = map.tiles[y][x]
        this.renderTile(tile, camera, zoom)
      }
    }
  }

  private getVisibleBounds(camera: Camera): {
    minX: number
    maxX: number
    minY: number
    maxY: number
  } {
    const { zoom, x: camX, y: camY } = camera
    const halfW = this.canvas.width / 2 / zoom
    const halfH = this.canvas.height / 2 / zoom

    // 粗略计算可见网格范围
    const tileW = TILE_WIDTH / 2
    const tileH = TILE_HEIGHT / 2

    const range = Math.ceil((halfW + halfH) / Math.min(tileW, tileH)) + 5

    // 中心网格位置
    const centerGx = (camX / tileW + camY / tileH) / 2
    const centerGy = (camY / tileH - camX / tileW) / 2

    return {
      minX: Math.floor(centerGx - range),
      maxX: Math.ceil(centerGx + range),
      minY: Math.floor(centerGy - range),
      maxY: Math.ceil(centerGy + range),
    }
  }

  private renderTile(tile: Tile, camera: Camera, zoom: number): void {
    const { x, y, type, connected } = tile
    const colors = TILE_COLORS[type]
    const height = BUILDING_HEIGHTS[type] * zoom

    // 内联坐标计算，避免函数调用开销
    const worldX = (x - y) * (TILE_WIDTH / 2)
    const worldY = (x + y) * (TILE_HEIGHT / 2)
    const sx = this.originX + (worldX - camera.x) * zoom
    const sy = this.originY + (worldY - camera.y) * zoom

    // 快速裁剪：跳过完全在屏幕外的瓦片
    const hw = (TILE_WIDTH / 2) * zoom
    if (
      sx + hw < 0 ||
      sx - hw > this.canvas.width ||
      sy + hw < -height ||
      sy - hw > this.canvas.height
    ) {
      return
    }

    const isBuilding = type !== TileType.Empty && type !== TileType.Road
    const dimmed = isBuilding && !connected

    this.drawIsometricBlock(sx, sy, colors, height, zoom, dimmed)
  }

  private drawIsometricBlock(
    cx: number,
    cy: number,
    colors: { top: string; left: string; right: string },
    height: number,
    zoom: number,
    dimmed = false
  ): void {
    const hw = (TILE_WIDTH / 2) * zoom
    const hh = (TILE_HEIGHT / 2) * zoom

    // 如果建筑未连接道路，应用灰暗效果
    const applyDim = (color: string): string => {
      if (!dimmed) return color
      // 将颜色转换为灰暗版本
      return this.dimColor(color)
    }

    if (height > 0) {
      // 左侧面
      this.ctx.fillStyle = applyDim(colors.left)
      this.ctx.beginPath()
      this.ctx.moveTo(cx - hw, cy)
      this.ctx.lineTo(cx - hw, cy - height)
      this.ctx.lineTo(cx, cy - height + hh)
      this.ctx.lineTo(cx, cy + hh)
      this.ctx.closePath()
      this.ctx.fill()

      // 右侧面
      this.ctx.fillStyle = applyDim(colors.right)
      this.ctx.beginPath()
      this.ctx.moveTo(cx + hw, cy)
      this.ctx.lineTo(cx + hw, cy - height)
      this.ctx.lineTo(cx, cy - height + hh)
      this.ctx.lineTo(cx, cy + hh)
      this.ctx.closePath()
      this.ctx.fill()
    }

    // 顶面
    this.ctx.fillStyle = applyDim(colors.top)
    this.ctx.beginPath()
    this.ctx.moveTo(cx, cy + hh - height)
    this.ctx.lineTo(cx + hw, cy - height)
    this.ctx.lineTo(cx, cy - hh - height)
    this.ctx.lineTo(cx - hw, cy - height)
    this.ctx.closePath()
    this.ctx.fill()

    // 边框
    this.ctx.strokeStyle = dimmed ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)'
    this.ctx.lineWidth = 1
    this.ctx.stroke()

    // 未连接建筑添加警告标记
    if (dimmed && height > 0) {
      this.ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
      this.ctx.font = `${12 * zoom}px sans-serif`
      this.ctx.textAlign = 'center'
      this.ctx.fillText('!', cx, cy - height - 5 * zoom)
    }
  }

  /** 将颜色变灰暗（带缓存） */
  private dimColor(color: string): string {
    const cached = this.dimColorCache.get(color)
    if (cached) return cached

    const hex = color.replace('#', '')
    if (hex.length !== 6) return color

    const r = Number.parseInt(hex.slice(0, 2), 16)
    const g = Number.parseInt(hex.slice(2, 4), 16)
    const b = Number.parseInt(hex.slice(4, 6), 16)

    const gray = (r + g + b) / 3
    const factor = 0.5
    const newR = Math.round(r * (1 - factor) + gray * factor * 0.7)
    const newG = Math.round(g * (1 - factor) + gray * factor * 0.7)
    const newB = Math.round(b * (1 - factor) + gray * factor * 0.7)

    const result = `rgb(${newR}, ${newG}, ${newB})`
    this.dimColorCache.set(color, result)
    return result
  }

  private renderHover(state: GameState): void {
    const { hoveredTile, currentTool, money, camera } = state
    if (!hoveredTile) return
    if (!isInBounds(hoveredTile.x, hoveredTile.y)) return

    const screen = gridToScreen(
      hoveredTile.x,
      hoveredTile.y,
      this.originX,
      this.originY,
      camera
    )
    const currentTileType = state.map.tiles[hoveredTile.y][hoveredTile.x].type

    let highlightColor = HOVER_COLOR

    // 检查是否可以放置
    if (currentTool !== ToolType.Select) {
      const targetType = toolToTileType[currentTool]
      if (targetType) {
        const cost = BUILDING_COSTS[targetType as keyof typeof BUILDING_COSTS]
        if (cost !== undefined) {
          const canPlace = currentTileType === TileType.Empty && money >= cost
          if (!canPlace) highlightColor = INVALID_COLOR
        }
      } else if (currentTool === ToolType.Demolish) {
        if (currentTileType === TileType.Empty) {
          highlightColor = INVALID_COLOR
        }
      }
    }

    this.drawHighlight(screen.x, screen.y, highlightColor, camera.zoom)
  }

  private drawHighlight(
    cx: number,
    cy: number,
    color: string,
    zoom: number
  ): void {
    const hw = (TILE_WIDTH / 2) * zoom
    const hh = (TILE_HEIGHT / 2) * zoom

    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.moveTo(cx, cy + hh)
    this.ctx.lineTo(cx + hw, cy)
    this.ctx.lineTo(cx, cy - hh)
    this.ctx.lineTo(cx - hw, cy)
    this.ctx.closePath()
    this.ctx.fill()
  }

  private renderCameraInfo(camera: Camera): void {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    this.ctx.font = '12px monospace'
    this.ctx.fillText(
      `Zoom: ${(camera.zoom * 100).toFixed(0)}% | WASD/拖拽平移 | 滚轮缩放 | Home重置`,
      10,
      this.canvas.height - 10
    )
  }
}
