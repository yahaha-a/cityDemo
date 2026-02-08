import {
  TerrainType,
  ToolType,
  toolToRoadType,
  isRoadTool,
  isTerraformTool,
} from 'shared/types'
import type { BuildingId, BuildingDefinition } from 'shared/types/building-defs'
import { rotateFootprint } from 'shared/types/building-defs'
import {
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
import type { PolicySystem } from './policy-system'
import type { SpecializationSystem } from './specialization-system'
import { isInBounds } from '../input/coordinate-utils'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'

let nextStructureId = 1

/**
 * 统一建筑系统 — 处理所有 16 种建筑的放置/拆除/升级
 */
export class BuildingSystemV2 implements IGameSystem {
  readonly id = 'building'
  private stateManager: GameStateManager
  private roadSystem!: RoadSystem
  private mapSystem!: MapSystem
  private policySystem!: PolicySystem
  private specializationSystem!: SpecializationSystem

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  init(registry: SystemRegistry): void {
    this.roadSystem = registry.get<RoadSystem>('road')
    this.mapSystem = registry.get<MapSystem>('map')
    this.policySystem = registry.get<PolicySystem>('policy')
    this.specializationSystem =
      registry.get<SpecializationSystem>('specialization')
  }

  /** 获取综合建造成本乘数（政策 + 专精） */
  private getCostMultiplier(): number {
    const policyBuildCost =
      this.policySystem.getAggregatedEffect('build_cost_multiplier') ?? 1
    const specBuildCost =
      this.specializationSystem.getEffectValue('build_cost_multiplier') ?? 1
    const specAllCost =
      this.specializationSystem.getEffectValue('all_cost_multiplier') ?? 1
    return policyBuildCost * specBuildCost * specAllCost
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
    if (isRoadTool(currentTool)) return this.buildRoad(x, y, currentTool)

    return false
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
      if (!tile || tile.buildingId !== 'empty') return false
      if (tile.terrain === TerrainType.Water) return false
    }

    // 检查解锁条件
    if (!this.isUnlocked(def)) return false

    // 计算费用
    const originTile = this.stateManager.getTileAt(x, y)!
    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[originTile.terrain]
    if (!Number.isFinite(terrainMult)) return false

    const actualCost = Math.ceil(def.cost * terrainMult * this.getCostMultiplier())
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
    if (!currentTile || currentTile.buildingId === 'empty') return false

    // 多格建筑
    if (currentTile.structureId) {
      this.demolishStructure(currentTile.structureId)
      return true
    }

    // 单格建筑 — 计算退款
    const buildingId = currentTile.buildingId
    if (buildingId === 'road') {
      // 道路退款
      const roadType = currentTile.roadType
      if (roadType) {
        const roadConfig = ROAD_CONFIGS[roadType]
        this.stateManager.addMoney(
          Math.floor(roadConfig.buildCost * DEMOLISH_REFUND_RATIO)
        )
      } else {
        const roadDef = getBuildingDef('road')
        const baseCost = roadDef?.cost ?? 10
        this.stateManager.addMoney(Math.floor(baseCost * DEMOLISH_REFUND_RATIO))
      }
    } else {
      // 建筑退款
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
    }

    this.stateManager.setTileByBuildingId(x, y, 'empty', 0)
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
          this.stateManager.setTileByBuildingId(fx, fy, 'empty', 0)
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
    if (tile.buildingId === 'empty' || tile.buildingId === 'road') return false

    const buildingId = tile.buildingId
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
      def.cost * mult * UPGRADE_COST_MULTIPLIER[tile.level] * this.getCostMultiplier()
    )

    if (!this.stateManager.spendMoney(upgradeCost)) return false

    // 多格建筑：同步升级所有关联格子和结构实例
    if (tile.structureId) {
      const instance = state.structures.instances[tile.structureId]
      if (instance) {
        const footprint = rotateFootprint(def.footprint, instance.rotation ?? 0)
        this.stateManager.batch(() => {
          for (const { dx, dy } of footprint) {
            this.stateManager.upgradeTileLevel(
              instance.originX + dx,
              instance.originY + dy
            )
          }
          this.stateManager.registerStructure({
            ...instance,
            level: tile.level + 1,
          })
        })
      }
    } else {
      this.stateManager.upgradeTileLevel(x, y)
    }

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
        tile.buildingId === 'empty' &&
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
   * 获取建造成本（含所有乘数）
   */
  getBuildCost(buildingId: BuildingId, terrain: TerrainType): number | null {
    const def = getBuildingDef(buildingId)
    if (!def) return null
    const terrainMult = TERRAIN_BUILD_COST_MULTIPLIER[terrain]
    if (!Number.isFinite(terrainMult)) return null
    return Math.ceil(def.cost * terrainMult * this.getCostMultiplier())
  }

  private buildRoad(x: number, y: number, tool: ToolType): boolean {
    const roadType = toolToRoadType[tool]
    if (!roadType) return false

    const currentTile = this.stateManager.getTileAt(x, y)
    if (!currentTile || currentTile.buildingId !== 'empty') return false

    const config = ROAD_CONFIGS[roadType]

    if (config.terrainAllowances.length > 0) {
      if (!config.terrainAllowances.includes(currentTile.terrain)) return false
    } else {
      if (config.terrainRestrictions.includes(currentTile.terrain)) return false
    }

    if (!this.stateManager.spendMoney(Math.ceil(config.buildCost * this.getCostMultiplier()))) return false

    this.stateManager.setTileByBuildingId(x, y, 'road', 1, roadType)
    this.roadSystem.updateLocalConnections(x, y)
    this.mapSystem.invalidateMapStats()

    return true
  }

  private terraform(x: number, y: number, tool: ToolType): boolean {
    const tile = this.stateManager.getTileAt(x, y)
    if (!tile) return false
    if (tile.buildingId !== 'empty') return false

    const action = getTerraformAction(tool)
    if (!action) return false
    if (!action.fromTerrains.includes(tile.terrain)) return false

    if (action.unlockTech) {
      const state = this.stateManager.getState()
      if (!state.tech.researched.includes(action.unlockTech)) return false
    }

    if (!this.stateManager.spendMoney(Math.ceil(action.cost * this.getCostMultiplier()))) return false

    this.stateManager.setTerrainAt(x, y, action.toTerrain, tile.terrain)
    this.mapSystem.invalidateMapStats()

    return true
  }
}
