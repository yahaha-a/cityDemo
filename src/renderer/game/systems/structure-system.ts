import { TileType, TerrainType } from 'shared/types'
import type { StructureInstance, StructureTemplate } from 'shared/types'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem, SystemRegistry } from '../engine/system-registry'
import {
  getStructureTemplate,
  STRUCTURE_TEMPLATES,
  COMBO_DEFINITIONS,
} from '../config/structures'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'
import type { RoadSystem } from './road-system'
import type { MapSystem } from './map-system'

let nextStructureId = 1

/**
 * 多格建筑系统
 */
export class StructureSystem implements IGameSystem {
  readonly id = 'structure'
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
   * 尝试放置多格建筑
   */
  tryPlaceStructure(
    templateId: string,
    originX: number,
    originY: number
  ): boolean {
    const template = getStructureTemplate(templateId)
    if (!template) return false

    // 验证所有足迹格
    for (const { dx, dy } of template.footprint) {
      const x = originX + dx
      const y = originY + dy

      if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false

      const tile = this.stateManager.getTileAt(x, y)
      if (!tile || tile.type !== TileType.Empty) return false

      // 水域不可建造（除非特定类型允许）
      if (tile.terrain === TerrainType.Water) return false
    }

    // 检查科技解锁
    if (template.unlockTech) {
      const state = this.stateManager.getState()
      if (!state.tech.researched.includes(template.unlockTech)) return false
    }

    // 扣费
    if (!this.stateManager.spendMoney(template.buildCost)) return false

    // 生成唯一 ID
    const structureId = `struct_${nextStructureId++}`

    // 批量放置所有格子
    this.stateManager.batch(() => {
      for (const { dx, dy } of template.footprint) {
        const x = originX + dx
        const y = originY + dy
        const isOrigin = dx === 0 && dy === 0

        this.stateManager.setTileAtSilent(x, y, template.tileType, 1)
        this.stateManager.setTileStructure(
          x,
          y,
          structureId,
          isOrigin ? 'origin' : 'part'
        )
        this.stateManager.addTileToStructure(x, y, structureId)
      }

      // 注册实例
      const instance: StructureInstance = {
        id: structureId,
        templateId,
        originX,
        originY,
        level: 1,
        connected: false,
      }
      this.stateManager.registerStructure(instance)
    })

    // 更新连接状态
    this.roadSystem.updateLocalConnections(originX, originY)
    this.mapSystem.invalidateMapStats()

    return true
  }

  /**
   * 拆除多格建筑
   */
  demolishStructure(structureId: string): void {
    const state = this.stateManager.getState()
    const instance = state.structures.instances[structureId]
    if (!instance) return

    const template = getStructureTemplate(instance.templateId)
    if (!template) {
      console.warn(
        `[StructureSystem] Template "${instance.templateId}" not found for structure "${structureId}", removing without refund`
      )
      this.stateManager.removeStructure(structureId)
      return
    }

    // 退款 50%
    this.stateManager.addMoney(Math.floor(template.buildCost * 0.5))

    // 批量清除所有格子
    this.stateManager.batch(() => {
      for (const { dx, dy } of template.footprint) {
        const x = instance.originX + dx
        const y = instance.originY + dy
        this.stateManager.setTileAtSilent(x, y, TileType.Empty, 0)
        this.stateManager.setTileStructure(x, y, undefined, undefined)
      }

      this.stateManager.removeStructure(structureId)
    })

    // 更新连接状态
    this.roadSystem.updateLocalConnections(instance.originX, instance.originY)
    this.mapSystem.invalidateMapStats()
  }

  /**
   * 获取放置预览的足迹信息
   */
  getPreviewFootprint(
    templateId: string,
    originX: number,
    originY: number
  ): Array<{ x: number; y: number; valid: boolean }> {
    const template = getStructureTemplate(templateId)
    if (!template) return []

    return template.footprint.map(({ dx, dy }) => {
      const x = originX + dx
      const y = originY + dy

      if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
        return { x, y, valid: false }
      }

      const tile = this.stateManager.getTileAt(x, y)
      const valid =
        tile !== null &&
        tile.type === TileType.Empty &&
        tile.terrain !== TerrainType.Water

      return { x, y, valid }
    })
  }

  /**
   * 检测并激活组合效果（每日 tick）
   */
  processDailyTick(): void {
    this.detectCombos()
  }

  /**
   * 扫描相邻结构的 comboTag 匹配，激活组合效果
   */
  private detectCombos(): void {
    const state = this.stateManager.getState()
    const { instances } = state.structures

    // 重置所有 combo
    for (const inst of Object.values(instances)) {
      inst.activeCombo = undefined
    }

    const instanceList = Object.values(instances)

    for (let i = 0; i < instanceList.length; i++) {
      const a = instanceList[i]
      const templateA = getStructureTemplate(a.templateId)
      if (!templateA?.comboTag) continue

      for (let j = i + 1; j < instanceList.length; j++) {
        const b = instanceList[j]
        const templateB = getStructureTemplate(b.templateId)
        if (!templateB?.comboTag) continue

        // 检查是否相邻（任一足迹格之间曼哈顿距离 <= 1）
        if (!this.areStructuresAdjacent(a, templateA, b, templateB)) continue

        // 查找匹配的 combo
        for (const combo of COMBO_DEFINITIONS) {
          const tags = [templateA.comboTag, templateB.comboTag]
          if (
            combo.requiredTags.every(t => tags.includes(t)) &&
            combo.requiredTags.length === 2
          ) {
            a.activeCombo = combo.id
            b.activeCombo = combo.id
          }
        }
      }
    }
  }

  private areStructuresAdjacent(
    a: StructureInstance,
    templateA: StructureTemplate,
    b: StructureInstance,
    templateB: StructureTemplate
  ): boolean {
    for (const cellA of templateA.footprint) {
      const ax = a.originX + cellA.dx
      const ay = a.originY + cellA.dy

      for (const cellB of templateB.footprint) {
        const bx = b.originX + cellB.dx
        const by = b.originY + cellB.dy

        const dist = Math.abs(ax - bx) + Math.abs(ay - by)
        if (dist === 1) return true
      }
    }
    return false
  }

  /** 获取所有可用模板 */
  getAvailableTemplates(): StructureTemplate[] {
    const state = this.stateManager.getState()
    return STRUCTURE_TEMPLATES.filter(
      t => !t.unlockTech || state.tech.researched.includes(t.unlockTech)
    )
  }
}
