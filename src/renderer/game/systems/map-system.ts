import type { DerivedMapStats } from 'shared/types'
import type { BuildingId, BuildingCategory } from 'shared/types/building-defs'
import { buildingIdToCategory } from 'shared/types/building-compat'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem } from '../engine/system-registry'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'

/** 所有 BuildingId 键列表（用于初始化计数） */
const ALL_BUILDING_IDS: BuildingId[] = [
  'empty',
  'road',
  'house',
  'apartment',
  'residential_complex',
  'shop',
  'office',
  'mall',
  'factory',
  'heavy_industry',
  'warehouse',
  'park',
  'plaza',
  'school',
  'hospital',
  'fire_station',
  'police_station',
  'power_plant',
]

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

    // 按 BuildingId 统计
    const buildingCounts = {} as Record<BuildingId, number>
    for (const id of ALL_BUILDING_IDS) buildingCounts[id] = 0

    const categoryCounts: Record<BuildingCategory, number> = {
      residential: 0,
      commercial: 0,
      industrial: 0,
      service: 0,
    }

    let buildingTotal = 0
    let buildingConnected = 0
    let roadCount = 0
    let emptyCount = 0

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]
        const bid = tile.buildingId

        buildingCounts[bid]++

        if (bid === 'empty') {
          emptyCount++
        } else if (bid === 'road') {
          roadCount++
        } else {
          buildingTotal++
          if (tile.connected) buildingConnected++
          const cat = buildingIdToCategory(bid)
          if (cat) categoryCounts[cat]++
        }
      }
    }

    const total = MAP_WIDTH * MAP_HEIGHT
    const used = total - emptyCount
    const usagePercent = Math.round((used / total) * 100)

    const mapStats: DerivedMapStats = {
      buildingCounts,
      categoryCounts,
      roadCount,
      emptyCount,
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

  /** 统计各 BuildingId 数量 */
  countBuildings(): Record<BuildingId, number> {
    const state = this.stateManager.getState()
    if (state._derived.mapStats) {
      return state._derived.mapStats.buildingCounts
    }

    const counts = {} as Record<BuildingId, number>
    for (const id of ALL_BUILDING_IDS) counts[id] = 0

    const { map } = state
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        counts[map.tiles[y][x].buildingId]++
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

    const counts = this.countBuildings()
    const total = MAP_WIDTH * MAP_HEIGHT
    const used = total - counts.empty
    return Math.round((used / total) * 100)
  }
}
