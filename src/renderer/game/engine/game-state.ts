import {
  type GameState,
  type GameMap,
  type Tile,
  type StateListener,
  TileType,
  ToolType,
} from 'shared/game-types'
import { MAP_WIDTH, MAP_HEIGHT, INITIAL_MONEY } from '../constants'

function createEmptyMap(): GameMap {
  const tiles: Tile[][] = []
  for (let y = 0; y < MAP_HEIGHT; y++) {
    tiles[y] = []
    for (let x = 0; x < MAP_WIDTH; x++) {
      tiles[y][x] = { type: TileType.Empty, x, y, level: 0 }
    }
  }
  return { width: MAP_WIDTH, height: MAP_HEIGHT, tiles }
}

function createInitialState(): GameState {
  return {
    map: createEmptyMap(),
    money: INITIAL_MONEY,
    currentTool: ToolType.Select,
    hoveredTile: null,
  }
}

/**
 * 游戏状态管理器 - 使用 pub/sub 模式
 * 兼容 React useSyncExternalStore
 */
export class GameStateManager {
  private state: GameState
  private listeners = new Set<StateListener>()

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

  setTool(tool: ToolType): void {
    if (this.state.currentTool === tool) return
    this.state.currentTool = tool
    this.notify()
  }

  setHoveredTile(tile: { x: number; y: number } | null): void {
    const prev = this.state.hoveredTile
    if (prev?.x === tile?.x && prev?.y === tile?.y) return
    this.state.hoveredTile = tile
    this.notify()
  }

  setTileAt(x: number, y: number, type: TileType, level = 1): void {
    this.state.map.tiles[y][x] = { type, x, y, level }
    this.notify()
  }

  spendMoney(amount: number): boolean {
    if (this.state.money < amount) return false
    this.state.money -= amount
    this.notify()
    return true
  }

  addMoney(amount: number): void {
    this.state.money += amount
    this.notify()
  }

  getTileAt(x: number, y: number): Tile | null {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return null
    return this.state.map.tiles[y][x]
  }
}
