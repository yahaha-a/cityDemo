import type { GameState, Tile } from 'shared/game-types'
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
  }

  private clear(): void {
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private renderMap(state: GameState): void {
    const { map } = state
    // 从后往前渲染，确保遮挡正确
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x]
        this.renderTile(tile)
      }
    }
  }

  private renderTile(tile: Tile): void {
    const { x, y, type } = tile
    const screen = gridToScreen(x, y, this.originX, this.originY)
    const colors = TILE_COLORS[type]
    const height = BUILDING_HEIGHTS[type]

    this.drawIsometricBlock(screen.x, screen.y, colors, height)
  }

  private drawIsometricBlock(
    cx: number,
    cy: number,
    colors: { top: string; left: string; right: string },
    height: number
  ): void {
    const hw = TILE_WIDTH / 2
    const hh = TILE_HEIGHT / 2

    if (height > 0) {
      // 左侧面
      this.ctx.fillStyle = colors.left
      this.ctx.beginPath()
      this.ctx.moveTo(cx - hw, cy)
      this.ctx.lineTo(cx - hw, cy - height)
      this.ctx.lineTo(cx, cy - height + hh)
      this.ctx.lineTo(cx, cy + hh)
      this.ctx.closePath()
      this.ctx.fill()

      // 右侧面
      this.ctx.fillStyle = colors.right
      this.ctx.beginPath()
      this.ctx.moveTo(cx + hw, cy)
      this.ctx.lineTo(cx + hw, cy - height)
      this.ctx.lineTo(cx, cy - height + hh)
      this.ctx.lineTo(cx, cy + hh)
      this.ctx.closePath()
      this.ctx.fill()
    }

    // 顶面
    this.ctx.fillStyle = colors.top
    this.ctx.beginPath()
    this.ctx.moveTo(cx, cy + hh - height)
    this.ctx.lineTo(cx + hw, cy - height)
    this.ctx.lineTo(cx, cy - hh - height)
    this.ctx.lineTo(cx - hw, cy - height)
    this.ctx.closePath()
    this.ctx.fill()

    // 边框
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
    this.ctx.lineWidth = 1
    this.ctx.stroke()
  }

  private renderHover(state: GameState): void {
    const { hoveredTile, currentTool, money } = state
    if (!hoveredTile) return
    if (!isInBounds(hoveredTile.x, hoveredTile.y)) return

    const screen = gridToScreen(
      hoveredTile.x,
      hoveredTile.y,
      this.originX,
      this.originY
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

    this.drawHighlight(screen.x, screen.y, highlightColor)
  }

  private drawHighlight(cx: number, cy: number, color: string): void {
    const hw = TILE_WIDTH / 2
    const hh = TILE_HEIGHT / 2

    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.moveTo(cx, cy + hh)
    this.ctx.lineTo(cx + hw, cy)
    this.ctx.lineTo(cx, cy - hh)
    this.ctx.lineTo(cx - hw, cy)
    this.ctx.closePath()
    this.ctx.fill()
  }
}
