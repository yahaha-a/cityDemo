import type {
  GameState,
  Tile,
  StateListener,
  Camera,
  TileType,
  ToolType,
  TimeSpeed,
  RoadType,
  TerrainType,
  StructureInstance,
} from 'shared/types'
import { CAMERA_MIN_ZOOM, CAMERA_MAX_ZOOM } from '../config'
import { createInitialState, createInitialCamera } from './initial-state'

/** GameState 的顶层键 */
export type StateKey = keyof GameState

interface KeyedSubscription {
  keys: Set<StateKey>
  listener: StateListener
}

/**
 * 游戏状态管理器 - 使用 pub/sub 模式
 * 兼容 React useSyncExternalStore
 * 支持按键订阅，避免无关状态变更触发重渲染
 */
export class GameStateManager {
  private state: GameState
  private listeners = new Set<StateListener>()
  private keyedListeners = new Set<KeyedSubscription>()
  private dirtyKeys = new Set<StateKey>()
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

  /** 订阅所有状态变更 (useSyncExternalStore 兼容) */
  subscribe = (listener: StateListener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** 订阅指定键的状态变更 — 仅当监听的键有变更时才通知 */
  subscribeKeys = (keys: StateKey[], listener: StateListener): (() => void) => {
    const sub: KeyedSubscription = { keys: new Set(keys), listener }
    this.keyedListeners.add(sub)
    return () => {
      this.keyedListeners.delete(sub)
    }
  }

  /** 标记变更的键 */
  private markDirty(...keys: StateKey[]): void {
    for (const key of keys) {
      this.dirtyKeys.add(key)
    }
    if (this.batchDepth === 0) this.flush()
  }

  /** 刷新通知 — 仅通知监听键与 dirtyKeys 有交集的订阅者 */
  private flush(): void {
    // 为 dirty 的嵌套对象创建新引用，使场景组件的引用比较能检测到变化
    const nestedKeys: StateKey[] = [
      'map',
      'economy',
      'structures',
      'productionChains',
      'time',
      'events',
      'policies',
      'tech',
      'specialization',
      'milestones',
      'challenge',
      'synergy',
      'facilities',
    ]
    for (const key of nestedKeys) {
      if (this.dirtyKeys.has(key)) {
        const val = this.state[key]
        if (val && typeof val === 'object') {
          ;(this.state as unknown as Record<string, unknown>)[key] = {
            ...val,
          }
        }
      }
    }

    // 创建新引用以触发 React 重渲染
    this.state = { ...this.state }

    // 通知全量订阅者
    for (const listener of this.listeners) {
      listener()
    }

    // 通知按键订阅者（仅当关注的键有变更）
    if (this.dirtyKeys.size > 0) {
      for (const sub of this.keyedListeners) {
        for (const key of sub.keys) {
          if (this.dirtyKeys.has(key)) {
            sub.listener()
            break
          }
        }
      }
    }

    this.dirtyKeys.clear()
  }

  /** 通用状态更新 — 替代所有 updateXxx / updateXxxSilent 方法 */
  update(patch: Partial<GameState>): void {
    const keys = Object.keys(patch) as StateKey[]
    Object.assign(this.state, patch)
    this.markDirty(...keys)
  }

  /** 批量操作 — 函数内所有 update/addMoney 等调用只在结束时触发一次通知 */
  batch(fn: () => void): void {
    this.batchDepth++
    try {
      fn()
    } finally {
      this.batchDepth--
      if (this.batchDepth === 0) this.flush()
    }
  }

  setTool(tool: ToolType): void {
    if (this.state.currentTool === tool) return
    this.state.currentTool = tool
    // 切换工具时清除多格建筑选择
    this.state.selectedStructureTemplate = null
    this.markDirty('currentTool', 'selectedStructureTemplate')
  }

  setSelectedStructureTemplate(templateId: string | null): void {
    if (this.state.selectedStructureTemplate === templateId) return
    this.state.selectedStructureTemplate = templateId
    this.markDirty('selectedStructureTemplate')
  }

  setHoveredTile(tile: { x: number; y: number } | null): void {
    const prev = this.state.hoveredTile
    if (prev?.x === tile?.x && prev?.y === tile?.y) return
    this.state.hoveredTile = tile
    this.markDirty('hoveredTile')
  }

  setTileAt(
    x: number,
    y: number,
    type: TileType,
    level = 1,
    roadType?: RoadType
  ): void {
    const existing = this.state.map.tiles[y][x]
    this.state.map.tiles[y][x] = {
      type,
      x,
      y,
      level,
      connected: false,
      terrain: existing.terrain,
      roadType,
    }
    this.markDirty('map')
  }

  /** 设置瓦片但不触发通知（用于批量操作，调用方自行包在 batch 中） */
  setTileAtSilent(
    x: number,
    y: number,
    type: TileType,
    level = 1,
    roadType?: RoadType
  ): void {
    const existing = this.state.map.tiles[y][x]
    this.state.map.tiles[y][x] = {
      type,
      x,
      y,
      level,
      connected: false,
      terrain: existing.terrain,
      roadType,
    }
  }

  /** 修改地形类型（用于地形改造） */
  setTerrainAt(
    x: number,
    y: number,
    terrain: TerrainType,
    originalTerrain?: TerrainType
  ): void {
    const tile = this.state.map.tiles[y][x]
    tile.terrain = terrain
    if (originalTerrain !== undefined) {
      tile.originalTerrain = originalTerrain
    } else if (!tile.originalTerrain) {
      tile.originalTerrain = tile.terrain
    }
    this.markDirty('map')
  }

  /** 设置格子的结构关联 */
  setTileStructure(
    x: number,
    y: number,
    structureId: string | undefined,
    role: 'origin' | 'part' | undefined
  ): void {
    const tile = this.state.map.tiles[y]?.[x]
    if (tile) {
      tile.structureId = structureId
      tile.structureRole = role
    }
  }

  /** 注册多格建筑实例 */
  registerStructure(instance: StructureInstance): void {
    this.state.structures.instances[instance.id] = instance
    this.markDirty('structures')
  }

  /** 移除多格建筑实例 */
  removeStructure(structureId: string): void {
    // 清理 tileToStructure 反向索引
    const structs = this.state.structures
    for (const [key, sid] of Object.entries(structs.tileToStructure)) {
      if (sid === structureId) {
        delete structs.tileToStructure[key]
      }
    }
    delete structs.instances[structureId]
    this.markDirty('structures')
  }

  /** 添加 tileToStructure 映射 */
  addTileToStructure(x: number, y: number, structureId: string): void {
    this.state.structures.tileToStructure[`${x},${y}`] = structureId
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
    if (changed) {
      this.markDirty('map')
    }
  }

  spendMoney(amount: number): boolean {
    if (this.state.money < amount) return false
    this.state.money -= amount
    this.markDirty('money')
    return true
  }

  addMoney(amount: number): void {
    this.state.money = Math.max(0, this.state.money + amount)
    this.markDirty('money')
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

  /** 更新 tick 累加器（每帧调用，静默更新不触发通知） */
  setTickAccumulator(value: number): void {
    this.state.time.tickAccumulator = value
  }

  // 时间控制方法
  setTimeSpeed(speed: TimeSpeed): void {
    if (this.state.time.speed === speed) return
    this.state.time = { ...this.state.time, speed }
    this.markDirty('time')
  }

  advanceDay(): void {
    this.state.time = {
      ...this.state.time,
      day: this.state.time.day + 1,
      tickAccumulator: 0,
    }
    this.markDirty('time')
  }

  /** 升级瓦片等级 */
  upgradeTileLevel(x: number, y: number): void {
    const tile = this.state.map.tiles[y]?.[x]
    if (tile) {
      tile.level += 1
      this.markDirty('map')
    }
  }

  /** 从完整状态恢复（用于存档加载） */
  loadState(state: GameState): void {
    this.state = state
    // 加载存档时标记所有键
    this.dirtyKeys.clear()
    for (const key of Object.keys(this.state) as StateKey[]) {
      this.dirtyKeys.add(key)
    }
    this.flush()
  }

  /** 重置游戏 */
  resetGame(): void {
    this.state = createInitialState()
    this.dirtyKeys.clear()
    for (const key of Object.keys(this.state) as StateKey[]) {
      this.dirtyKeys.add(key)
    }
    this.flush()
  }
}
