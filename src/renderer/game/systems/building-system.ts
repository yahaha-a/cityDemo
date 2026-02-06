import {
  TileType,
  TerrainType,
  ToolType,
  toolToTileType,
  isFacilityType,
  isCoreBuilding,
} from 'shared/game-types'
import {
  BUILDING_COSTS,
  DEMOLISH_REFUND_RATIO,
  TERRAIN_BUILD_COST_MULTIPLIER,
  MAX_BUILDING_LEVEL,
  UPGRADE_COST_MULTIPLIER,
  UPGRADE_MIN_EFFICIENCY,
} from '../constants'
import { getFacilityTemplate } from '../constants'
import type { GameStateManager } from '../engine/game-state'
import type { RoadSystem } from './road-system'
import type { FacilitySystem } from './facility-system'
import { isInBounds } from '../input/coordinate-utils'

/**
 * 建筑放置系统
 */
export class BuildingSystem {
  private stateManager: GameStateManager
  private roadSystem: RoadSystem
  private facilitySystem: FacilitySystem

  constructor(
    stateManager: GameStateManager,
    roadSystem: RoadSystem,
    facilitySystem: FacilitySystem
  ) {
    this.stateManager = stateManager
    this.roadSystem = roadSystem
    this.facilitySystem = facilitySystem
  }

  /**
   * 尝试在指定位置执行当前工具操作
   * @returns 是否操作成功
   */
  tryAction(x: number, y: number): boolean {
    if (!isInBounds(x, y)) return false

    const state = this.stateManager.getState()
    const { currentTool } = state

    if (currentTool === ToolType.Select) return false
    if (currentTool === ToolType.Demolish) return this.demolish(x, y)
    if (currentTool === ToolType.Upgrade) return this.upgrade(x, y)

    return this.build(x, y, currentTool)
  }

  private build(x: number, y: number, tool: ToolType): boolean {
    const tileType = toolToTileType[tool]
    if (!tileType) return false

    const currentTile = this.stateManager.getTileAt(x, y)
    if (!currentTile || currentTile.type !== TileType.Empty) return false

    // 水域不可建造
    if (currentTile.terrain === TerrainType.Water) return false

    // 设施类型需要额外检查
    if (isFacilityType(tileType)) {
      return this.buildFacility(x, y, tileType)
    }

    const baseCost = BUILDING_COSTS[tileType as keyof typeof BUILDING_COSTS]
    if (baseCost === undefined) return false

    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[currentTile.terrain]
    if (!Number.isFinite(terrainMult)) return false

    const actualCost = Math.ceil(baseCost * terrainMult)
    if (!this.stateManager.spendMoney(actualCost)) return false

    this.stateManager.setTileAt(x, y, tileType, 1)
    this.roadSystem.updateLocalConnections(x, y)

    return true
  }

  private buildFacility(x: number, y: number, tileType: TileType): boolean {
    // 检查设施是否已解锁
    if (!this.facilitySystem.isFacilityUnlocked(tileType)) {
      return false
    }

    const template = getFacilityTemplate(tileType)
    if (!template) return false

    const currentTile = this.stateManager.getTileAt(x, y)
    if (!currentTile) return false

    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[currentTile.terrain]
    if (!Number.isFinite(terrainMult)) return false

    const actualCost = Math.ceil(template.buildCost * terrainMult)
    if (!this.stateManager.spendMoney(actualCost)) return false

    this.stateManager.setTileAt(x, y, tileType, 1)
    this.roadSystem.updateLocalConnections(x, y)

    return true
  }

  private demolish(x: number, y: number): boolean {
    const currentTile = this.stateManager.getTileAt(x, y)
    if (!currentTile || currentTile.type === TileType.Empty) return false

    // 计算退款
    if (isFacilityType(currentTile.type)) {
      // 设施退款
      const template = getFacilityTemplate(currentTile.type)
      if (template) {
        const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[currentTile.terrain]
        const mult = Number.isFinite(terrainMult) ? terrainMult : 1
        const totalInvested = Math.ceil(template.buildCost * mult)
        this.stateManager.addMoney(
          Math.floor(totalInvested * DEMOLISH_REFUND_RATIO)
        )
      }
    } else {
      const baseCost =
        BUILDING_COSTS[currentTile.type as keyof typeof BUILDING_COSTS]
      if (baseCost !== undefined) {
        const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[currentTile.terrain]
        const mult = Number.isFinite(terrainMult) ? terrainMult : 1
        let totalInvested = Math.ceil(baseCost * mult)

        for (let lv = 2; lv <= currentTile.level; lv++) {
          totalInvested += Math.ceil(
            baseCost * mult * UPGRADE_COST_MULTIPLIER[lv - 1]
          )
        }

        this.stateManager.addMoney(
          Math.floor(totalInvested * DEMOLISH_REFUND_RATIO)
        )
      }
    }

    this.stateManager.setTileAt(x, y, TileType.Empty, 0)
    this.roadSystem.updateLocalConnections(x, y)

    return true
  }

  private upgrade(x: number, y: number): boolean {
    const tile = this.stateManager.getTileAt(x, y)
    if (!tile) return false

    // 只有核心建筑可升级（不含道路、空地、设施）
    if (!isCoreBuilding(tile.type)) return false

    if (tile.level >= MAX_BUILDING_LEVEL) return false

    const state = this.stateManager.getState()
    if (tile.level === 2 && !state.milestones.upgradeLv3Unlocked) return false

    if (!tile.connected) return false

    const efficiency =
      tile.type === TileType.Residential
        ? state.economy.efficiencyByType.residential
        : tile.type === TileType.Commercial
          ? state.economy.efficiencyByType.commercial
          : state.economy.efficiencyByType.industrial
    if (efficiency < UPGRADE_MIN_EFFICIENCY) return false

    const baseCost = BUILDING_COSTS[tile.type as keyof typeof BUILDING_COSTS]
    if (baseCost === undefined) return false

    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[tile.terrain]
    const mult = Number.isFinite(terrainMult) ? terrainMult : 1
    const upgradeCost = Math.ceil(
      baseCost * mult * UPGRADE_COST_MULTIPLIER[tile.level]
    )

    if (!this.stateManager.spendMoney(upgradeCost)) return false

    this.stateManager.upgradeTileLevel(x, y)
    return true
  }

  /** 获取建造成本（考虑设施和地形） */
  getBuildCost(
    tileType: TileType,
    terrain: import('shared/game-types').TerrainType
  ): number | null {
    if (isFacilityType(tileType)) {
      const template = getFacilityTemplate(tileType)
      if (!template) return null
      const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[terrain]
      if (!Number.isFinite(terrainMult)) return null
      return Math.ceil(template.buildCost * terrainMult)
    }

    const baseCost = BUILDING_COSTS[tileType as keyof typeof BUILDING_COSTS]
    if (baseCost === undefined) return null
    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[terrain]
    if (!Number.isFinite(terrainMult)) return null
    return Math.ceil(baseCost * terrainMult)
  }
}
