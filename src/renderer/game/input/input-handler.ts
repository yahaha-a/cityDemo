import type { GameStateManager } from '../engine/game-state'
import type { BuildingSystem } from '../systems/building-system'
import type { IsometricRenderer } from '../renderer/isometric-renderer'
import { screenToGrid, isInBounds } from './coordinate-utils'

/**
 * 输入处理器 - 处理鼠标事件
 */
export class InputHandler {
  private stateManager: GameStateManager
  private buildingSystem: BuildingSystem
  private renderer: IsometricRenderer
  private canvas: HTMLCanvasElement
  private isDragging = false

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect()
    // 需要将 CSS 坐标转换为 canvas 内部坐标
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const origin = this.renderer.getOrigin()
    const grid = screenToGrid(x, y, origin.x, origin.y)

    if (isInBounds(grid.x, grid.y)) {
      this.stateManager.setHoveredTile({ x: grid.x, y: grid.y })

      // 拖拽建造
      if (this.isDragging) {
        this.buildingSystem.tryAction(grid.x, grid.y)
      }
    } else {
      this.stateManager.setHoveredTile(null)
    }
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return // 仅左键

    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const origin = this.renderer.getOrigin()
    const grid = screenToGrid(x, y, origin.x, origin.y)

    if (isInBounds(grid.x, grid.y)) {
      this.isDragging = true
      this.buildingSystem.tryAction(grid.x, grid.y)
    }
  }

  private onMouseUp = (): void => {
    this.isDragging = false
  }

  private onMouseLeave = (): void => {
    this.isDragging = false
    this.stateManager.setHoveredTile(null)
  }

  constructor(
    canvas: HTMLCanvasElement,
    stateManager: GameStateManager,
    buildingSystem: BuildingSystem,
    renderer: IsometricRenderer
  ) {
    this.canvas = canvas
    this.stateManager = stateManager
    this.buildingSystem = buildingSystem
    this.renderer = renderer
  }

  attach(): void {
    this.canvas.addEventListener('mousemove', this.onMouseMove)
    this.canvas.addEventListener('mousedown', this.onMouseDown)
    this.canvas.addEventListener('mouseup', this.onMouseUp)
    this.canvas.addEventListener('mouseleave', this.onMouseLeave)
  }

  detach(): void {
    this.canvas.removeEventListener('mousemove', this.onMouseMove)
    this.canvas.removeEventListener('mousedown', this.onMouseDown)
    this.canvas.removeEventListener('mouseup', this.onMouseUp)
    this.canvas.removeEventListener('mouseleave', this.onMouseLeave)
  }
}
