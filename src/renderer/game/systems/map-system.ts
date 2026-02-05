import { TileType } from 'shared/game-types'
import type { GameStateManager } from '../engine/game-state'
import { MAP_WIDTH, MAP_HEIGHT } from '../constants'

/**
 * 地图工具函数
 */
export class MapSystem {
  private stateManager: GameStateManager

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  /** 统计各类型建筑数量 */
  countTiles(): Record<TileType, number> {
    const counts: Record<TileType, number> = {
      [TileType.Empty]: 0,
      [TileType.Road]: 0,
      [TileType.Residential]: 0,
      [TileType.Commercial]: 0,
      [TileType.Industrial]: 0,
    }

    const { map } = this.stateManager.getState()
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        counts[map.tiles[y][x].type]++
      }
    }

    return counts
  }

  /** 获取已使用的地块百分比 */
  getUsagePercent(): number {
    const counts = this.countTiles()
    const total = MAP_WIDTH * MAP_HEIGHT
    const used = total - counts[TileType.Empty]
    return Math.round((used / total) * 100)
  }
}
