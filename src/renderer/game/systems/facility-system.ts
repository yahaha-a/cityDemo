import {
  type TileType,
  isFacilityType,
  type FacilityCoverageState,
  type FacilityCoverageInfo,
} from 'shared/types'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem } from '../engine/system-registry'
import { MAP_WIDTH, MAP_HEIGHT, getFacilityTemplate } from '../config'

/**
 * 区域设施系统 - 计算设施覆盖范围和区域效果
 */
export class FacilitySystem implements IGameSystem {
  readonly id = 'facility'
  private stateManager: GameStateManager

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  processDailyTick(): void {
    this.processDailyFacilities()
  }

  /** 检查设施是否已解锁 */
  isFacilityUnlocked(tileType: TileType): boolean {
    if (!isFacilityType(tileType)) return false
    const template = getFacilityTemplate(tileType)
    if (!template) return false
    if (!template.unlockTech) return true
    const state = this.stateManager.getState()
    return state.tech.researched.includes(template.unlockTech)
  }

  /** 获取设施建造成本 */
  getFacilityCost(tileType: TileType): number | null {
    const template = getFacilityTemplate(tileType)
    return template?.buildCost ?? null
  }

  /** 每日计算设施覆盖区域效果 */
  processDailyFacilities(): void {
    const state = this.stateManager.getState()
    const { map } = state
    const coverage: Record<string, FacilityCoverageInfo> = {}
    let totalMaintenance = 0
    let totalResearchPoints = 0
    let crisisResistanceSum = 0
    let crisisResistanceCount = 0

    // 遍历地图找到所有设施
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]
        if (!isFacilityType(tile.type) || !tile.connected) continue

        const template = getFacilityTemplate(tile.type)
        if (!template) continue

        totalMaintenance += template.maintenanceCost

        // 计算覆盖范围内的效果
        for (let dy = -template.radius; dy <= template.radius; dy++) {
          for (let dx = -template.radius; dx <= template.radius; dx++) {
            const manhattan = Math.abs(dx) + Math.abs(dy)
            if (manhattan > template.radius) continue

            const tx = x + dx
            const ty = y + dy
            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT)
              continue

            const key = `${tx},${ty}`
            if (!coverage[key]) {
              coverage[key] = {
                satisfactionMod: 0,
                incomeMultiplier: 1,
                efficiencyMultiplier: 1,
                crisisResistance: 0,
                capacityMultiplier: 1,
                researchPoints: 0,
                facilities: [],
              }
            }

            const info = coverage[key]
            const targetTile = map.tiles[ty][tx]

            for (const effect of template.effects) {
              // 如果效果指定了目标类型，只影响匹配的瓦片
              if (
                effect.targetTileType &&
                targetTile.type !== effect.targetTileType
              ) {
                continue
              }

              switch (effect.type) {
                case 'satisfaction':
                  info.satisfactionMod += effect.value
                  break
                case 'income_multiplier':
                  info.incomeMultiplier *= effect.value
                  break
                case 'efficiency_multiplier':
                  info.efficiencyMultiplier *= effect.value
                  break
                case 'crisis_resistance':
                  info.crisisResistance = Math.min(
                    1,
                    info.crisisResistance + effect.value
                  )
                  crisisResistanceSum += effect.value
                  crisisResistanceCount++
                  break
                case 'capacity_multiplier':
                  info.capacityMultiplier *= effect.value
                  break
                case 'research_points':
                  info.researchPoints += effect.value
                  totalResearchPoints += effect.value
                  break
              }
            }

            if (!info.facilities.includes(tile.type)) {
              info.facilities.push(tile.type)
            }
          }
        }
      }
    }

    const avgCrisisResistance =
      crisisResistanceCount > 0
        ? Math.min(1, crisisResistanceSum / Math.max(1, crisisResistanceCount))
        : 0

    const facilitiesState: FacilityCoverageState = {
      coverage,
      totalMaintenance,
      totalResearchPoints,
      avgCrisisResistance,
    }

    this.stateManager.update({ facilities: facilitiesState })
  }
}
