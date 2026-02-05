import type { GameStateManager } from '../engine/game-state'
import type { BuildingSystem } from '../systems/building-system'
import type { IsometricRenderer } from '../renderer/isometric-renderer'
import { screenToGrid, isInBounds } from './coordinate-utils'
import {
  CAMERA_ZOOM_SPEED,
  CAMERA_MIN_ZOOM,
  CAMERA_MAX_ZOOM,
} from '../constants'

/**
 * 输入处理器 - 处理鼠标和键盘事件
 */
export class InputHandler {
  private stateManager: GameStateManager
  private buildingSystem: BuildingSystem
  private renderer: IsometricRenderer
  private canvas: HTMLCanvasElement

  // 建造拖拽状态
  private isBuilding = false

  // 相机平移状态
  private isPanning = false
  private lastPanX = 0
  private lastPanY = 0

  // 缓存 canvas rect，避免每次 mousemove 都触发 layout
  private cachedRect: DOMRect | null = null
  private rectCacheTime = 0

  private getMousePos(e: MouseEvent): { x: number; y: number } {
    const now = performance.now()
    if (!this.cachedRect || now - this.rectCacheTime > 500) {
      this.cachedRect = this.canvas.getBoundingClientRect()
      this.rectCacheTime = now
    }
    const rect = this.cachedRect
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  private onMouseMove = (e: MouseEvent): void => {
    const pos = this.getMousePos(e)
    const origin = this.renderer.getOrigin()
    const camera = this.stateManager.getCamera()

    // 相机平移
    if (this.isPanning) {
      const dx = (this.lastPanX - pos.x) / camera.zoom
      const dy = (this.lastPanY - pos.y) / camera.zoom
      this.stateManager.panCamera(dx, dy)
      this.lastPanX = pos.x
      this.lastPanY = pos.y
      return
    }

    const grid = screenToGrid(pos.x, pos.y, origin.x, origin.y, camera)

    if (isInBounds(grid.x, grid.y)) {
      this.stateManager.setHoveredTile({ x: grid.x, y: grid.y })

      // 拖拽建造
      if (this.isBuilding) {
        this.buildingSystem.tryAction(grid.x, grid.y)
      }
    } else {
      this.stateManager.setHoveredTile(null)
    }
  }

  private onMouseDown = (e: MouseEvent): void => {
    const pos = this.getMousePos(e)

    // 中键或右键：开始平移
    if (e.button === 1 || e.button === 2) {
      e.preventDefault()
      this.isPanning = true
      this.lastPanX = pos.x
      this.lastPanY = pos.y
      this.canvas.style.cursor = 'grabbing'
      return
    }

    // 左键：建造
    if (e.button === 0) {
      const origin = this.renderer.getOrigin()
      const camera = this.stateManager.getCamera()
      const grid = screenToGrid(pos.x, pos.y, origin.x, origin.y, camera)

      if (isInBounds(grid.x, grid.y)) {
        this.isBuilding = true
        this.buildingSystem.tryAction(grid.x, grid.y)
      }
    }
  }

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.isBuilding = false
    }
    if (e.button === 1 || e.button === 2) {
      this.isPanning = false
      this.canvas.style.cursor = 'default'
    }
  }

  private onMouseLeave = (): void => {
    this.isBuilding = false
    this.isPanning = false
    this.canvas.style.cursor = 'default'
    this.stateManager.setHoveredTile(null)
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    const pos = this.getMousePos(e)
    const origin = this.renderer.getOrigin()
    const camera = this.stateManager.getCamera()

    // 计算鼠标位置对应的世界坐标作为缩放中心
    const worldX = (pos.x - origin.x) / camera.zoom + camera.x
    const worldY = (pos.y - origin.y) / camera.zoom + camera.y

    const delta = e.deltaY > 0 ? -CAMERA_ZOOM_SPEED : CAMERA_ZOOM_SPEED
    const newZoom = Math.max(
      CAMERA_MIN_ZOOM,
      Math.min(CAMERA_MAX_ZOOM, camera.zoom + delta)
    )

    if (newZoom !== camera.zoom) {
      // 计算新的相机位置以保持鼠标指向的世界坐标不变
      const newCamX = worldX - (pos.x - origin.x) / newZoom
      const newCamY = worldY - (pos.y - origin.y) / newZoom

      this.stateManager.panCamera(newCamX - camera.x, newCamY - camera.y)
      this.stateManager.setZoom(newZoom)
    }
  }

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault()
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    // 输入框中不处理快捷键
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return
    }

    const camera = this.stateManager.getCamera()
    const panAmount = 50 / camera.zoom

    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.stateManager.panCamera(0, -panAmount)
        break
      case 's':
      case 'arrowdown':
        this.stateManager.panCamera(0, panAmount)
        break
      case 'a':
      case 'arrowleft':
        this.stateManager.panCamera(-panAmount, 0)
        break
      case 'd':
      case 'arrowright':
        this.stateManager.panCamera(panAmount, 0)
        break
      case '=':
      case '+':
        this.stateManager.setZoom(camera.zoom + CAMERA_ZOOM_SPEED)
        break
      case '-':
        this.stateManager.setZoom(camera.zoom - CAMERA_ZOOM_SPEED)
        break
      case 'home':
        this.stateManager.resetCamera()
        break
    }
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

  /** 使 rect 缓存失效（窗口 resize 时调用） */
  invalidateRectCache(): void {
    this.cachedRect = null
  }

  attach(): void {
    this.canvas.addEventListener('mousemove', this.onMouseMove)
    this.canvas.addEventListener('mousedown', this.onMouseDown)
    window.addEventListener('mouseup', this.onMouseUp)
    this.canvas.addEventListener('mouseleave', this.onMouseLeave)
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false })
    this.canvas.addEventListener('contextmenu', this.onContextMenu)
    window.addEventListener('keydown', this.onKeyDown)
  }

  detach(): void {
    this.canvas.removeEventListener('mousemove', this.onMouseMove)
    this.canvas.removeEventListener('mousedown', this.onMouseDown)
    window.removeEventListener('mouseup', this.onMouseUp)
    this.canvas.removeEventListener('mouseleave', this.onMouseLeave)
    this.canvas.removeEventListener('wheel', this.onWheel)
    this.canvas.removeEventListener('contextmenu', this.onContextMenu)
    window.removeEventListener('keydown', this.onKeyDown)
  }
}
