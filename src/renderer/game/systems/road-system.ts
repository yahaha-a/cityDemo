import { RoadType } from 'shared/types'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem, SystemRegistry } from '../engine/system-registry'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'
import { ROAD_CONFIGS } from '../config/road'
import type { MapSystem } from './map-system'

/**
 * 道路连接系统
 * 检测建筑是否连接到道路网络
 */
export class RoadSystem implements IGameSystem {
  readonly id = 'road'
  private stateManager: GameStateManager
  private mapSystem: MapSystem | null = null

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  init(registry: SystemRegistry): void {
    this.mapSystem = registry.get<MapSystem>('map')
  }

  /**
   * 检查指定位置是否被道路网络覆盖
   * 考虑不同道路类型的连接半径
   */
  isConnectedToRoad(x: number, y: number): boolean {
    const { map } = this.stateManager.getState()
    const maxRadius = 2 // Highway 的最大连接半径

    for (let dy = -maxRadius; dy <= maxRadius; dy++) {
      for (let dx = -maxRadius; dx <= maxRadius; dx++) {
        if (dx === 0 && dy === 0) continue
        // 使用曼哈顿距离
        const dist = Math.abs(dx) + Math.abs(dy)
        if (dist > maxRadius) continue

        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue

        const neighbor = map.tiles[ny][nx]
        if (neighbor.buildingId !== 'road') continue

        const roadType = neighbor.roadType ?? RoadType.Normal
        const config = ROAD_CONFIGS[roadType]
        if (dist <= config.connectionRadius) {
          return true
        }
      }
    }
    return false
  }

  /**
   * 更新指定位置及其邻居的连接状态
   * 用于建造/拆除时的局部更新
   * 扩大扫描范围以覆盖 Highway 的 2 格连接半径
   */
  updateLocalConnections(centerX: number, centerY: number): void {
    const { map } = this.stateManager.getState()
    const updates: Array<{ x: number; y: number; connected: boolean }> = []

    // 扩大到半径 3（建筑可能在 highway radius=2 之内）
    const scanRadius = 3
    for (let dy = -scanRadius; dy <= scanRadius; dy++) {
      for (let dx = -scanRadius; dx <= scanRadius; dx++) {
        const x = centerX + dx
        const y = centerY + dy
        if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) continue

        const tile = map.tiles[y][x]

        // 空地不需要连接状态
        if (tile.buildingId === 'empty') {
          if (tile.connected) {
            updates.push({ x, y, connected: false })
          }
          continue
        }

        // 道路始终视为已连接
        if (tile.buildingId === 'road') {
          if (!tile.connected) {
            updates.push({ x, y, connected: true })
          }
          continue
        }

        // 建筑检查是否被道路覆盖
        const connected = this.isConnectedToRoad(x, y)
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
   * 更新所有建筑的连接状态
   * 建筑只需在道路连接半径内即视为已连接
   */
  updateAllConnections(): void {
    const { map } = this.stateManager.getState()
    const updates: Array<{ x: number; y: number; connected: boolean }> = []

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]

        // 空地和道路不需要连接状态
        if (tile.buildingId === 'empty') {
          if (tile.connected) {
            updates.push({ x, y, connected: false })
          }
          continue
        }

        // 道路始终视为已连接
        if (tile.buildingId === 'road') {
          if (!tile.connected) {
            updates.push({ x, y, connected: true })
          }
          continue
        }

        // 建筑检查是否被道路覆盖
        const connected = this.isConnectedToRoad(x, y)
        if (tile.connected !== connected) {
          updates.push({ x, y, connected })
        }
      }
    }

    if (updates.length > 0) {
      this.stateManager.updateConnections(updates)
      this.mapSystem?.invalidateMapStats()
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
          tile.buildingId !== 'empty' &&
          tile.buildingId !== 'road' &&
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
        if (tile.buildingId !== 'empty' && tile.buildingId !== 'road') {
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
