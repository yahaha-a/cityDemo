import {
  TileType,
  TerrainType,
  ToolType,
  toolToTileType,
  toolToRoadType,
  isRoadTool,
  isTerraformTool,
} from 'shared/types'
import type { BuildingId, BuildingDefinition } from 'shared/types/building-defs'
import { rotateFootprint } from 'shared/types/building-defs'
import {
  BUILDING_COSTS,
  DEMOLISH_REFUND_RATIO,
  TERRAIN_BUILD_COST_MULTIPLIER,
  UPGRADE_COST_MULTIPLIER,
  UPGRADE_MIN_EFFICIENCY,
} from '../config'
import { getBuildingDef } from '../config/building-defs'
import { ROAD_CONFIGS } from '../config/road'
import { getTerraformAction } from '../config/terraform'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem, SystemRegistry } from '../engine/system-registry'
import type { RoadSystem } from './road-system'
import type { MapSystem } from './map-system'
import { isInBounds } from '../input/coordinate-utils'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'

let nextStructureId = 1

/**
 * 统一建筑系统 V2 — 处理所有 16 种建筑的放置/拆除/升级
 * 替代旧的 BuildingSystem + StructureSystem
 */
export class BuildingSystemV2 implements IGameSystem {
  readonly id = 'building'
  private stateManager: GameStateManager
  private roadSystem!: RoadSystem
  private mapSystem!: MapSystem

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  init(registry: SystemRegistry): void {
    this.roadSystem = registry.get<RoadSystem>('road')
    this.mapSystem = registry.get<MapSystem>('map')
  }

  /**
   * 尝试在指定位置执行当前工具操作
   */
  tryAction(x: number, y: number): boolean {
    if (!isInBounds(x, y)) return false

    const state = this.stateManager.getState()
    const { currentTool } = state

    // 新建筑系统优先：selectedBuildingId
    const selectedBuildingId = state.selectedBuildingId
    if (selectedBuildingId) {
      return this.tryPlaceBuilding(selectedBuildingId, x, y)
    }

    if (currentTool === ToolType.Select) return false
    if (currentTool === ToolType.Demolish) return this.demolish(x, y)
    if (currentTool === ToolType.Upgrade) return this.upgrade(x, y)
    if (isTerraformTool(currentTool)) return this.terraform(x, y, currentTool)

    // 旧路径：通过 tool → tileType 映射
    return this.buildLegacy(x, y, currentTool)
  }

  /**
   * 统一放置建筑
   */
  tryPlaceBuilding(buildingId: BuildingId, x: number, y: number): boolean {
    const def = getBuildingDef(buildingId)
    if (!def) return false

    const rotation = this.stateManager.getState().buildingRotation
    const footprint = rotateFootprint(def.footprint, rotation)

    // 验证所有足迹格
    for (const { dx, dy } of footprint) {
      const fx = x + dx
      const fy = y + dy

      if (fx < 0 || fx >= MAP_WIDTH || fy < 0 || fy >= MAP_HEIGHT) return false

      const tile = this.stateManager.getTileAt(fx, fy)
      if (!tile || tile.type !== TileType.Empty) return false
      if (tile.terrain === TerrainType.Water) return false
    }

    // 检查解锁条件
    if (!this.isUnlocked(def)) return false

    // 计算费用
    const originTile = this.stateManager.getTileAt(x, y)!
    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[originTile.terrain]
    if (!Number.isFinite(terrainMult)) return false

    const actualCost = Math.ceil(def.cost * terrainMult)
    if (!this.stateManager.spendMoney(actualCost)) return false

    if (footprint.length === 1) {
      // 单格建筑
      this.stateManager.setTileByBuildingId(x, y, buildingId, 1)
    } else {
      // 多格建筑
      const structureId = `struct_${nextStructureId++}`

      this.stateManager.batch(() => {
        for (const { dx, dy } of footprint) {
          const fx = x + dx
          const fy = y + dy
          const isOrigin = dx === 0 && dy === 0

          this.stateManager.setTileByBuildingId(fx, fy, buildingId, 1)
          this.stateManager.setTileStructure(
            fx,
            fy,
            structureId,
            isOrigin ? 'origin' : 'part'
          )
          this.stateManager.addTileToStructure(fx, fy, structureId)
        }

        this.stateManager.registerStructure({
          id: structureId,
          templateId: buildingId,
          originX: x,
          originY: y,
          level: 1,
          connected: false,
          rotation,
        })
      })
    }

    this.roadSystem.updateLocalConnections(x, y)
    this.mapSystem.invalidateMapStats()

    return true
  }

  /**
   * 统一拆除
   */
  demolish(x: number, y: number): boolean {
    const currentTile = this.stateManager.getTileAt(x, y)
    if (!currentTile || currentTile.type === TileType.Empty) return false

    // 多格建筑
    if (currentTile.structureId) {
      this.demolishStructure(currentTile.structureId)
      return true
    }

    // 单格建筑 — 计算退款
    const buildingId = currentTile.buildingId
    if (buildingId && buildingId !== 'empty' && buildingId !== 'road') {
      const def = getBuildingDef(buildingId)
      if (def) {
        const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[currentTile.terrain]
        const mult = Number.isFinite(terrainMult) ? terrainMult : 1
        let totalInvested = Math.ceil(def.cost * mult)

        for (let lv = 2; lv <= currentTile.level; lv++) {
          totalInvested += Math.ceil(
            def.cost * mult * UPGRADE_COST_MULTIPLIER[lv - 1]
          )
        }

        this.stateManager.addMoney(
          Math.floor(totalInvested * DEMOLISH_REFUND_RATIO)
        )
      }
    } else if (currentTile.type === TileType.Road) {
      // 道路退款
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
    }

    this.stateManager.setTileAt(x, y, TileType.Empty, 0)
    this.roadSystem.updateLocalConnections(x, y)
    this.mapSystem.invalidateMapStats()

    return true
  }

  /**
   * 拆除多格建筑
   */
  private demolishStructure(structureId: string): void {
    const state = this.stateManager.getState()
    const instance = state.structures.instances[structureId]
    if (!instance) return

    const def = getBuildingDef(instance.templateId)
    if (def) {
      // 退款 50%
      this.stateManager.addMoney(Math.floor(def.cost * DEMOLISH_REFUND_RATIO))

      const footprint = rotateFootprint(def.footprint, instance.rotation ?? 0)

      // 批量清除所有格子
      this.stateManager.batch(() => {
        for (const { dx, dy } of footprint) {
          const fx = instance.originX + dx
          const fy = instance.originY + dy
          this.stateManager.setTileAt(fx, fy, TileType.Empty, 0)
          this.stateManager.setTileStructure(fx, fy, undefined, undefined)
        }
        this.stateManager.removeStructure(structureId)
      })
    } else {
      // 无定义：回退清理
      this.stateManager.removeStructure(structureId)
    }

    this.roadSystem.updateLocalConnections(instance.originX, instance.originY)
    this.mapSystem.invalidateMapStats()
  }

  /**
   * 统一升级 — 所有建筑都可升级
   */
  upgrade(x: number, y: number): boolean {
    const tile = this.stateManager.getTileAt(x, y)
    if (!tile) return false

    // 空地和道路不可升级
    if (tile.type === TileType.Empty || tile.type === TileType.Road)
      return false

    const buildingId = tile.buildingId
    if (!buildingId) return false

    const def = getBuildingDef(buildingId)
    if (!def) return false

    if (tile.level >= def.maxLevel) return false

    const state = this.stateManager.getState()
    // Lv3 需要里程碑解锁
    if (tile.level === 2 && !state.milestones.upgradeLv3Unlocked) return false

    // 必须连接道路
    if (!tile.connected) return false

    // 检查效率
    const category = def.category
    if (
      category === 'residential' ||
      category === 'commercial' ||
      category === 'industrial'
    ) {
      const efficiency = state.economy.efficiencyByType[category]
      if (efficiency < UPGRADE_MIN_EFFICIENCY) return false
    }

    // 计算升级费用
    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[tile.terrain]
    const mult = Number.isFinite(terrainMult) ? terrainMult : 1
    const upgradeCost = Math.ceil(
      def.cost * mult * UPGRADE_COST_MULTIPLIER[tile.level]
    )

    if (!this.stateManager.spendMoney(upgradeCost)) return false

    this.stateManager.upgradeTileLevel(x, y)
    this.mapSystem.invalidateMapStats()
    return true
  }

  /**
   * 获取放置预览的足迹信息
   */
  getPreviewFootprint(
    buildingId: BuildingId,
    originX: number,
    originY: number,
    rotation = 0
  ): Array<{ x: number; y: number; valid: boolean }> {
    const def = getBuildingDef(buildingId)
    if (!def) return []

    const footprint = rotateFootprint(def.footprint, rotation)

    return footprint.map(({ dx, dy }) => {
      const fx = originX + dx
      const fy = originY + dy

      if (fx < 0 || fx >= MAP_WIDTH || fy < 0 || fy >= MAP_HEIGHT) {
        return { x: fx, y: fy, valid: false }
      }

      const tile = this.stateManager.getTileAt(fx, fy)
      const valid =
        tile !== null &&
        tile.type === TileType.Empty &&
        tile.terrain !== TerrainType.Water

      return { x: fx, y: fy, valid }
    })
  }

  /**
   * 检查建筑是否已解锁
   */
  isUnlocked(def: BuildingDefinition): boolean {
    if (def.unlockCondition.type === 'initial') return true

    const state = this.stateManager.getState()

    if (def.unlockCondition.type === 'tech') {
      return state.tech.researched.includes(def.unlockCondition.id!)
    }

    if (def.unlockCondition.type === 'milestone') {
      return state.milestones.achieved.includes(def.unlockCondition.id!)
    }

    return false
  }

  /**
   * 获取建造成本
   */
  getBuildCost(buildingId: BuildingId, terrain: TerrainType): number | null {
    const def = getBuildingDef(buildingId)
    if (!def) return null
    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[terrain]
    if (!Number.isFinite(terrainMult)) return null
    return Math.ceil(def.cost * terrainMult)
  }

  // === 旧兼容路径 ===

  private buildLegacy(x: number, y: number, tool: ToolType): boolean {
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

    // 查找对应的 BuildingId
    const buildingId = this.toolToBuildingId(tool)
    if (buildingId) {
      return this.tryPlaceBuilding(buildingId, x, y)
    }

    return false
  }

  private buildRoad(x: number, y: number, tool: ToolType): boolean {
    const roadType = toolToRoadType[tool]
    if (!roadType) return false

    const currentTile = this.stateManager.getTileAt(x, y)
    if (!currentTile || currentTile.type !== TileType.Empty) return false

    const config = ROAD_CONFIGS[roadType]

    if (config.terrainAllowances.length > 0) {
      if (!config.terrainAllowances.includes(currentTile.terrain)) return false
    } else {
      if (config.terrainRestrictions.includes(currentTile.terrain)) return false
    }

    if (!this.stateManager.spendMoney(config.buildCost)) return false

    this.stateManager.setTileAt(x, y, TileType.Road, 1, roadType)
    this.roadSystem.updateLocalConnections(x, y)
    this.mapSystem.invalidateMapStats()

    return true
  }

  private terraform(x: number, y: number, tool: ToolType): boolean {
    const tile = this.stateManager.getTileAt(x, y)
    if (!tile) return false
    if (tile.type !== TileType.Empty) return false

    const action = getTerraformAction(tool)
    if (!action) return false
    if (!action.fromTerrains.includes(tile.terrain)) return false

    if (action.unlockTech) {
      const state = this.stateManager.getState()
      if (!state.tech.researched.includes(action.unlockTech)) return false
    }

    if (!this.stateManager.spendMoney(action.cost)) return false

    this.stateManager.setTerrainAt(x, y, action.toTerrain, tile.terrain)
    this.mapSystem.invalidateMapStats()

    return true
  }

  /** 工具类型映射到默认 BuildingId */
  private toolToBuildingId(tool: ToolType): BuildingId | null {
    switch (tool) {
      case ToolType.Residential:
        return 'house'
      case ToolType.Commercial:
        return 'shop'
      case ToolType.Industrial:
        return 'factory'
      case ToolType.Park:
        return 'park'
      case ToolType.School:
        return 'school'
      case ToolType.Hospital:
        return 'hospital'
      case ToolType.FireStation:
        return 'fire_station'
      case ToolType.PoliceStation:
        return 'police_station'
      case ToolType.PowerPlant:
        return 'power_plant'
      default:
        return null
    }
  }
}
