import { TileType } from 'shared/game-types'
import type { GameStateManager } from '../engine/game-state'
import { MAP_WIDTH, MAP_HEIGHT } from '../constants'

/**
 * 道路连接系统
 * 检测建筑是否连接到道路网络
 */
export class RoadSystem {
  private stateManager: GameStateManager

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  /** 四方向邻居偏移 */
  private static NEIGHBORS = [
    { dx: 0, dy: -1 }, // 上
    { dx: 0, dy: 1 }, // 下
    { dx: -1, dy: 0 }, // 左
    { dx: 1, dy: 0 }, // 右
  ]

  /**
   * 检查指定位置是否与道路相邻
   */
  isAdjacentToRoad(x: number, y: number): boolean {
    const { map } = this.stateManager.getState()

    for (const { dx, dy } of RoadSystem.NEIGHBORS) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
        if (map.tiles[ny][nx].type === TileType.Road) {
          return true
        }
      }
    }
    return false
  }

  /**
   * 更新指定位置及其邻居的连接状态
   * 用于建造/拆除时的局部更新
   */
  updateLocalConnections(centerX: number, centerY: number): void {
    const { map } = this.stateManager.getState()
    const updates: Array<{ x: number; y: number; connected: boolean }> = []

    // 检查中心位置及其四周共 5 个格子
    const positions = [
      { x: centerX, y: centerY },
      ...RoadSystem.NEIGHBORS.map(({ dx, dy }) => ({
        x: centerX + dx,
        y: centerY + dy,
      })),
    ]

    for (const { x, y } of positions) {
      if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) continue

      const tile = map.tiles[y][x]

      // 空地不需要连接状态
      if (tile.type === TileType.Empty) {
        if (tile.connected) {
          updates.push({ x, y, connected: false })
        }
        continue
      }

      // 道路始终视为已连接
      if (tile.type === TileType.Road) {
        if (!tile.connected) {
          updates.push({ x, y, connected: true })
        }
        continue
      }

      // 建筑检查是否与道路相邻
      const connected = this.isAdjacentToRoad(x, y)
      if (tile.connected !== connected) {
        updates.push({ x, y, connected })
      }
    }

    if (updates.length > 0) {
      this.stateManager.updateConnections(updates)
    }
  }

  /**
   * 更新所有建筑的连接状态
   * 建筑只需与道路相邻即视为已连接
   */
  updateAllConnections(): void {
    const { map } = this.stateManager.getState()
    const updates: Array<{ x: number; y: number; connected: boolean }> = []

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]

        // 空地和道路不需要连接状态
        if (tile.type === TileType.Empty) {
          if (tile.connected) {
            updates.push({ x, y, connected: false })
          }
          continue
        }

        // 道路始终视为已连接
        if (tile.type === TileType.Road) {
          if (!tile.connected) {
            updates.push({ x, y, connected: true })
          }
          continue
        }

        // 建筑检查是否与道路相邻
        const connected = this.isAdjacentToRoad(x, y)
        if (tile.connected !== connected) {
          updates.push({ x, y, connected })
        }
      }
    }

    if (updates.length > 0) {
      this.stateManager.updateConnections(updates)
    }
  }

  /**
   * 获取所有未连接的建筑
   */
  getDisconnectedBuildings(): Array<{ x: number; y: number }> {
    const { map } = this.stateManager.getState()
    const disconnected: Array<{ x: number; y: number }> = []

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]
        if (
          tile.type !== TileType.Empty &&
          tile.type !== TileType.Road &&
          !tile.connected
        ) {
          disconnected.push({ x, y })
        }
      }
    }

    return disconnected
  }

  /**
   * 统计连接状态
   */
  getConnectionStats(): {
    total: number
    connected: number
    disconnected: number
  } {
    const { map } = this.stateManager.getState()
    let total = 0
    let connected = 0

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]
        if (tile.type !== TileType.Empty && tile.type !== TileType.Road) {
          total++
          if (tile.connected) {
            connected++
          }
        }
      }
    }

    return {
      total,
      connected,
      disconnected: total - connected,
    }
  }
}
