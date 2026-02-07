import {
  TileType,
  TerrainType,
  ToolType,
  toolToTileType,
  toolToRoadType,
  isRoadTool,
  isTerraformTool,
  isFacilityType,
  isCoreBuilding,
} from 'shared/types'
import {
  BUILDING_COSTS,
  DEMOLISH_REFUND_RATIO,
  TERRAIN_BUILD_COST_MULTIPLIER,
  MAX_BUILDING_LEVEL,
  UPGRADE_COST_MULTIPLIER,
  UPGRADE_MIN_EFFICIENCY,
} from '../config'
import { ROAD_CONFIGS } from '../config/road'
import { getTerraformAction } from '../config/terraform'
import { getFacilityTemplate } from '../config'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem, SystemRegistry } from '../engine/system-registry'
import type { RoadSystem } from './road-system'
import type { FacilitySystem } from './facility-system'
import type { MapSystem } from './map-system'
import type { StructureSystem } from './structure-system'
import { isInBounds } from '../input/coordinate-utils'

/**
 * 建筑放置系统
 */
export class BuildingSystem implements IGameSystem {
  readonly id = 'building'
  private stateManager: GameStateManager
  private roadSystem!: RoadSystem
  private facilitySystem!: FacilitySystem
  private mapSystem!: MapSystem
  private structureSystem!: StructureSystem

  constructor(
    stateManager: GameStateManager,
    roadSystem?: RoadSystem,
    facilitySystem?: FacilitySystem
  ) {
    this.stateManager = stateManager
    if (roadSystem) this.roadSystem = roadSystem
    if (facilitySystem) this.facilitySystem = facilitySystem
  }

  init(registry: SystemRegistry): void {
    this.roadSystem = registry.get<RoadSystem>('road')
    this.facilitySystem = registry.get<FacilitySystem>('facility')
    this.mapSystem = registry.get<MapSystem>('map')
    this.structureSystem = registry.get<StructureSystem>('structure')
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
    if (isTerraformTool(currentTool)) return this.terraform(x, y, currentTool)

    return this.build(x, y, currentTool)
  }

  private build(x: number, y: number, tool: ToolType): boolean {
    const tileType = toolToTileType[tool]
    if (!tileType) return false

    const currentTile = this.stateManager.getTileAt(x, y)
    if (!currentTile || currentTile.type !== TileType.Empty) return false

    // 道路工具特殊处理
    if (isRoadTool(tool)) {
      return this.buildRoad(x, y, tool)
    }

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
    this.mapSystem.invalidateMapStats()

    return true
  }

  private buildRoad(x: number, y: number, tool: ToolType): boolean {
    const roadType = toolToRoadType[tool]
    if (!roadType) return false

    const currentTile = this.stateManager.getTileAt(x, y)
    if (!currentTile || currentTile.type !== TileType.Empty) return false

    const config = ROAD_CONFIGS[roadType]

    // 地形限制检查
    if (config.terrainAllowances.length > 0) {
      // 有白名单时，地形必须在白名单中
      if (!config.terrainAllowances.includes(currentTile.terrain)) return false
    } else {
      // 无白名单时，检查黑名单
      if (config.terrainRestrictions.includes(currentTile.terrain)) return false
    }

    if (!this.stateManager.spendMoney(config.buildCost)) return false

    this.stateManager.setTileAt(x, y, TileType.Road, 1, roadType)
    this.roadSystem.updateLocalConnections(x, y)
    this.mapSystem.invalidateMapStats()

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
    this.mapSystem.invalidateMapStats()

    return true
  }

  private demolish(x: number, y: number): boolean {
    const currentTile = this.stateManager.getTileAt(x, y)
    if (!currentTile || currentTile.type === TileType.Empty) return false

    // 多格建筑委托给 StructureSystem
    if (currentTile.structureId) {
      this.structureSystem.demolishStructure(currentTile.structureId)
      return true
    }

    // 计算退款
    if (currentTile.type === TileType.Road) {
      // 道路退款 - 根据道路子类型
      const roadType = currentTile.roadType
      if (roadType) {
        const roadConfig = ROAD_CONFIGS[roadType]
        this.stateManager.addMoney(
          Math.floor(roadConfig.buildCost * DEMOLISH_REFUND_RATIO)
        )
      } else {
        const baseCost =
          BUILDING_COSTS[TileType.Road as keyof typeof BUILDING_COSTS]
        if (baseCost !== undefined) {
          this.stateManager.addMoney(
            Math.floor(baseCost * DEMOLISH_REFUND_RATIO)
          )
        }
      }
    } else if (isFacilityType(currentTile.type)) {
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
    this.mapSystem.invalidateMapStats()

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
    this.mapSystem.invalidateMapStats()
    return true
  }

  private terraform(x: number, y: number, tool: ToolType): boolean {
    const tile = this.stateManager.getTileAt(x, y)
    if (!tile) return false

    // 只有空地可以进行地形改造
    if (tile.type !== TileType.Empty) return false

    const action = getTerraformAction(tool)
    if (!action) return false

    // 检查地形兼容性
    if (!action.fromTerrains.includes(tile.terrain)) return false

    // 检查科技解锁
    if (action.unlockTech) {
      const state = this.stateManager.getState()
      if (!state.tech.researched.includes(action.unlockTech)) return false
    }

    // 扣费
    if (!this.stateManager.spendMoney(action.cost)) return false

    // 记录原始地形并修改
    this.stateManager.setTerrainAt(x, y, action.toTerrain, tile.terrain)
    this.mapSystem.invalidateMapStats()

    return true
  }

  /** 获取建造成本（考虑设施和地形） */
  getBuildCost(
    tileType: TileType,
    terrain: import('shared/types').TerrainType
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
