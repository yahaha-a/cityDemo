import { TileType } from 'shared/types'
import type { DerivedMapStats } from 'shared/types'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem } from '../engine/system-registry'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'

/**
 * 地图工具函数
 */
export class MapSystem implements IGameSystem {
  readonly id = 'map'
  private stateManager: GameStateManager

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  /** 重新计算地图统计并写入 _derived.mapStats */
  invalidateMapStats(): void {
    const { map } = this.stateManager.getState()
    const tileCounts: Record<TileType, number> = {
      [TileType.Empty]: 0,
      [TileType.Road]: 0,
      [TileType.Residential]: 0,
      [TileType.Commercial]: 0,
      [TileType.Industrial]: 0,
      [TileType.Park]: 0,
      [TileType.School]: 0,
      [TileType.Hospital]: 0,
      [TileType.FireStation]: 0,
      [TileType.PoliceStation]: 0,
      [TileType.PowerPlant]: 0,
    }
    let buildingTotal = 0
    let buildingConnected = 0

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]
        tileCounts[tile.type]++

        if (tile.type !== TileType.Empty && tile.type !== TileType.Road) {
          buildingTotal++
          if (tile.connected) buildingConnected++
        }
      }
    }

    const total = MAP_WIDTH * MAP_HEIGHT
    const used = total - tileCounts[TileType.Empty]
    const usagePercent = Math.round((used / total) * 100)

    const mapStats: DerivedMapStats = {
      tileCounts,
      usagePercent,
      connectionStats: {
        total: buildingTotal,
        connected: buildingConnected,
        disconnected: buildingTotal - buildingConnected,
      },
    }

    this.stateManager.update({
      _derived: { mapStats },
    })
  }

  /** 统计各类型建筑数量 */
  countTiles(): Record<TileType, number> {
    const state = this.stateManager.getState()
    if (state._derived.mapStats) {
      return state._derived.mapStats.tileCounts
    }

    const counts: Record<TileType, number> = {
      [TileType.Empty]: 0,
      [TileType.Road]: 0,
      [TileType.Residential]: 0,
      [TileType.Commercial]: 0,
      [TileType.Industrial]: 0,
      [TileType.Park]: 0,
      [TileType.School]: 0,
      [TileType.Hospital]: 0,
      [TileType.FireStation]: 0,
      [TileType.PoliceStation]: 0,
      [TileType.PowerPlant]: 0,
    }

    const { map } = state
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        counts[map.tiles[y][x].type]++
      }
    }

    return counts
  }

  /** 获取已使用的地块百分比 */
  getUsagePercent(): number {
    const state = this.stateManager.getState()
    if (state._derived.mapStats) {
      return state._derived.mapStats.usagePercent
    }

    const counts = this.countTiles()
    const total = MAP_WIDTH * MAP_HEIGHT
    const used = total - counts[TileType.Empty]
    return Math.round((used / total) * 100)
  }
}
