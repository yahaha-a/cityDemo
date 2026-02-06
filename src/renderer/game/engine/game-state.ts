import type {
  GameState,
  Tile,
  StateListener,
  Camera,
  TileType,
  ToolType,
  TimeSpeed,
} from 'shared/game-types'
import { CAMERA_MIN_ZOOM, CAMERA_MAX_ZOOM } from '../constants'
import { createInitialState, createInitialCamera } from './initial-state'

/**
 * 游戏状态管理器 - 使用 pub/sub 模式
 * 兼容 React useSyncExternalStore
 */
export class GameStateManager {
  private state: GameState
  private listeners = new Set<StateListener>()
  private batchDepth = 0

  constructor() {
    this.state = createInitialState()
  }

  getState(): GameState {
    return this.state
  }

  /** 获取快照 (useSyncExternalStore 兼容) */
  getSnapshot = (): GameState => {
    return this.state
  }

  /** 订阅状态变更 (useSyncExternalStore 兼容) */
  subscribe = (listener: StateListener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    // 创建新引用以触发 React 重渲染
    this.state = { ...this.state }
    for (const listener of this.listeners) {
      listener()
    }
  }

  /** 通用状态更新 — 替代所有 updateXxx / updateXxxSilent 方法 */
  update(patch: Partial<GameState>): void {
    Object.assign(this.state, patch)
    if (this.batchDepth === 0) this.notify()
  }

  /** 批量操作 — 函数内所有 update/addMoney 等调用只在结束时触发一次通知 */
  batch(fn: () => void): void {
    this.batchDepth++
    try {
      fn()
    } finally {
      this.batchDepth--
      if (this.batchDepth === 0) this.notify()
    }
  }

  setTool(tool: ToolType): void {
    if (this.state.currentTool === tool) return
    this.state.currentTool = tool
    if (this.batchDepth === 0) this.notify()
  }

  setHoveredTile(tile: { x: number; y: number } | null): void {
    const prev = this.state.hoveredTile
    if (prev?.x === tile?.x && prev?.y === tile?.y) return
    this.state.hoveredTile = tile
    if (this.batchDepth === 0) this.notify()
  }

  setTileAt(x: number, y: number, type: TileType, level = 1): void {
    const existing = this.state.map.tiles[y][x]
    this.state.map.tiles[y][x] = {
      type,
      x,
      y,
      level,
      connected: false,
      terrain: existing.terrain,
    }
    if (this.batchDepth === 0) this.notify()
  }

  /** 设置瓦片但不触发通知（用于批量操作，调用方自行包在 batch 中） */
  setTileAtSilent(x: number, y: number, type: TileType, level = 1): void {
    const existing = this.state.map.tiles[y][x]
    this.state.map.tiles[y][x] = {
      type,
      x,
      y,
      level,
      connected: false,
      terrain: existing.terrain,
    }
  }

  /** 批量更新瓦片连接状态（接受坐标数组，避免字符串解析） */
  updateConnections(
    updates: Array<{ x: number; y: number; connected: boolean }>
  ): void {
    let changed = false
    for (const { x, y, connected } of updates) {
      const tile = this.state.map.tiles[y]?.[x]
      if (tile && tile.connected !== connected) {
        tile.connected = connected
        changed = true
      }
    }
    if (changed && this.batchDepth === 0) {
      this.notify()
    }
  }

  spendMoney(amount: number): boolean {
    if (this.state.money < amount) return false
    this.state.money -= amount
    if (this.batchDepth === 0) this.notify()
    return true
  }

  addMoney(amount: number): void {
    this.state.money = Math.max(0, this.state.money + amount)
    if (this.batchDepth === 0) this.notify()
  }

  getTileAt(x: number, y: number): Tile | null {
    if (
      x < 0 ||
      x >= this.state.map.width ||
      y < 0 ||
      y >= this.state.map.height
    )
      return null
    return this.state.map.tiles[y][x]
  }

  // 相机控制方法（静默更新，不触发 React 重渲染）
  panCamera(dx: number, dy: number): void {
    const cam = this.state.camera
    this.state.camera = {
      x: cam.x + dx,
      y: cam.y + dy,
      zoom: cam.zoom,
    }
  }

  setZoom(zoom: number, pivotX?: number, pivotY?: number): void {
    const { camera } = this.state
    const newZoom = Math.max(CAMERA_MIN_ZOOM, Math.min(CAMERA_MAX_ZOOM, zoom))
    if (newZoom === camera.zoom) return

    if (pivotX !== undefined && pivotY !== undefined) {
      const zoomRatio = newZoom / camera.zoom
      const newX = pivotX - (pivotX - camera.x) * zoomRatio
      const newY = pivotY - (pivotY - camera.y) * zoomRatio
      this.state.camera = { x: newX, y: newY, zoom: newZoom }
    } else {
      this.state.camera = { ...camera, zoom: newZoom }
    }
  }

  getCamera(): Camera {
    return this.state.camera
  }

  resetCamera(): void {
    this.state.camera = createInitialCamera()
  }

  // 时间控制方法
  setTimeSpeed(speed: TimeSpeed): void {
    if (this.state.time.speed === speed) return
    this.state.time = { ...this.state.time, speed }
    if (this.batchDepth === 0) this.notify()
  }

  advanceDay(): void {
    this.state.time = {
      ...this.state.time,
      day: this.state.time.day + 1,
      tickAccumulator: 0,
    }
    if (this.batchDepth === 0) this.notify()
  }

  /** 升级瓦片等级 */
  upgradeTileLevel(x: number, y: number): void {
    const tile = this.state.map.tiles[y]?.[x]
    if (tile) {
      tile.level += 1
      if (this.batchDepth === 0) this.notify()
    }
  }

  /** 从完整状态恢复（用于存档加载） */
  loadState(state: GameState): void {
    this.state = state
    this.notify()
  }

  /** 重置游戏 */
  resetGame(): void {
    this.state = createInitialState()
    this.notify()
  }
}
