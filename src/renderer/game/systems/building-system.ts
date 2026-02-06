import {
  TileType,
  TerrainType,
  ToolType,
  toolToTileType,
} from 'shared/game-types'
import {
  BUILDING_COSTS,
  DEMOLISH_REFUND_RATIO,
  TERRAIN_BUILD_COST_MULTIPLIER,
  MAX_BUILDING_LEVEL,
  UPGRADE_COST_MULTIPLIER,
  UPGRADE_MIN_EFFICIENCY,
} from '../constants'
import type { GameStateManager } from '../engine/game-state'
import type { RoadSystem } from './road-system'
import { isInBounds } from '../input/coordinate-utils'

/**
 * 建筑放置系统
 */
export class BuildingSystem {
  private stateManager: GameStateManager
  private roadSystem: RoadSystem

  constructor(stateManager: GameStateManager, roadSystem: RoadSystem) {
    this.stateManager = stateManager
    this.roadSystem = roadSystem
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

    const baseCost = BUILDING_COSTS[tileType as keyof typeof BUILDING_COSTS]
    if (baseCost === undefined) return false

    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[currentTile.terrain]
    if (!Number.isFinite(terrainMult)) return false

    const actualCost = Math.ceil(baseCost * terrainMult)
    if (!this.stateManager.spendMoney(actualCost)) return false

    this.stateManager.setTileAt(x, y, tileType, 1)

    // 更新道路连接状态（仅局部）
    this.roadSystem.updateLocalConnections(x, y)

    return true
  }

  private demolish(x: number, y: number): boolean {
    const currentTile = this.stateManager.getTileAt(x, y)
    if (!currentTile || currentTile.type === TileType.Empty) return false

    // 计算退款：基础成本 + 升级投入
    const baseCost =
      BUILDING_COSTS[currentTile.type as keyof typeof BUILDING_COSTS]
    if (baseCost !== undefined) {
      const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[currentTile.terrain]
      const mult = Number.isFinite(terrainMult) ? terrainMult : 1
      let totalInvested = Math.ceil(baseCost * mult)

      // 加上升级投入的费用
      for (let lv = 2; lv <= currentTile.level; lv++) {
        totalInvested += Math.ceil(
          baseCost * mult * UPGRADE_COST_MULTIPLIER[lv - 1]
        )
      }

      this.stateManager.addMoney(
        Math.floor(totalInvested * DEMOLISH_REFUND_RATIO)
      )
    }

    this.stateManager.setTileAt(x, y, TileType.Empty, 0)

    // 更新道路连接状态（仅局部）
    this.roadSystem.updateLocalConnections(x, y)

    return true
  }

  private upgrade(x: number, y: number): boolean {
    const tile = this.stateManager.getTileAt(x, y)
    if (!tile) return false

    // 只有建筑可升级（不含道路和空地）
    if (tile.type === TileType.Empty || tile.type === TileType.Road)
      return false

    // 检查等级上限
    if (tile.level >= MAX_BUILDING_LEVEL) return false

    // Lv3 需里程碑解锁
    const state = this.stateManager.getState()
    if (tile.level === 2 && !state.milestones.upgradeLv3Unlocked) return false

    // 必须已连接
    if (!tile.connected) return false

    // 效率检查
    const efficiency =
      tile.type === TileType.Residential
        ? state.economy.efficiencyByType.residential
        : tile.type === TileType.Commercial
          ? state.economy.efficiencyByType.commercial
          : state.economy.efficiencyByType.industrial
    if (efficiency < UPGRADE_MIN_EFFICIENCY) return false

    // 计算升级费用
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
}
