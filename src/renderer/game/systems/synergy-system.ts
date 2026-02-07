import { TileType, type SynergyState, type TileSynergyInfo } from 'shared/types'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem } from '../engine/system-registry'
import { MAP_WIDTH, MAP_HEIGHT, SYNERGY_RULES } from '../config'

/**
 * 邻接协同系统 - 计算建筑间的正面/负面邻接效应
 */
export class SynergySystem implements IGameSystem {
  readonly id = 'synergy'
  private stateManager: GameStateManager
  private radiusOverrides: Record<string, number> = {}

  // 空间索引：按 TileType 索引的建筑位置列表
  private buildingIndex = new Map<TileType, Array<{ x: number; y: number }>>()
  private lastMapRef: unknown = null

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  processDailyTick(): void {
    this.processDailySynergy()
  }

  /** 修改协同规则半径（用于科技效果，每个 ruleId 只允许设置一次） */
  private appliedOverrides = new Set<string>()

  setRadiusOverride(ruleId: string, delta: number): void {
    const key = `${ruleId}:${delta}`
    if (this.appliedOverrides.has(key)) return
    this.appliedOverrides.add(key)
    this.radiusOverrides[ruleId] = (this.radiusOverrides[ruleId] ?? 0) + delta
  }

  /** 获取规则的有效半径 */
  private getEffectiveRadius(ruleId: string, baseRadius: number): number {
    const override = this.radiusOverrides[ruleId] ?? 0
    return Math.max(0, baseRadius + override)
  }

  /** 更新空间索引（仅在 map 变化时调用） */
  private rebuildIndex(): void {
    const state = this.stateManager.getState()
    const { map } = state

    // 引用比较：map 未变则跳过
    if (map === this.lastMapRef) return
    this.lastMapRef = map

    this.buildingIndex.clear()

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]
        if (tile.type === TileType.Empty || !tile.connected) continue

        let list = this.buildingIndex.get(tile.type)
        if (!list) {
          list = []
          this.buildingIndex.set(tile.type, list)
        }
        list.push({ x, y })
      }
    }
  }

  /** 每日计算所有协同效果 */
  processDailySynergy(): void {
    const state = this.stateManager.getState()
    const { map } = state

    // 重建空间索引
    this.rebuildIndex()

    const tileEffects: Record<string, TileSynergyInfo> = {}

    // 全局汇总
    let globalSatisfactionMod = 0
    const incomeMultByType = { residential: 1, commercial: 1, industrial: 1 }
    const effMultByType = { residential: 1, commercial: 1, industrial: 1 }

    // 统计各规则对每个瓦片的影响叠加数（用数字键替代字符串）
    const stackCounts: Record<number, Record<string, number>> = {}

    for (const rule of SYNERGY_RULES) {
      const radius = this.getEffectiveRadius(rule.id, rule.radius)
      if (radius <= 0) continue

      // 只遍历源类型的建筑，而非全图
      const sources = this.buildingIndex.get(rule.sourceTileType)
      if (!sources || sources.length === 0) continue

      for (const { x, y } of sources) {
        // 扫描半径内的目标瓦片
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx === 0 && dy === 0) continue
            const manhattan = Math.abs(dx) + Math.abs(dy)
            if (manhattan > radius) continue

            const tx = x + dx
            const ty = y + dy
            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT)
              continue

            const target = map.tiles[ty][tx]
            if (target.type !== rule.targetTileType || !target.connected)
              continue

            const numKey = tx + ty * MAP_WIDTH
            if (!stackCounts[numKey]) stackCounts[numKey] = {}
            const current = stackCounts[numKey][rule.id] ?? 0
            if (current >= rule.maxStacks) continue
            stackCounts[numKey][rule.id] = current + 1

            const strKey = `${tx},${ty}`
            // 初始化效果
            if (!tileEffects[strKey]) {
              tileEffects[strKey] = {
                satisfactionMod: 0,
                incomeMultiplier: 1,
                efficiencyMultiplier: 1,
                sources: [],
              }
            }

            const info = tileEffects[strKey]
            switch (rule.effect.type) {
              case 'satisfaction':
                info.satisfactionMod += rule.effect.value
                break
              case 'income_multiplier':
                info.incomeMultiplier *= rule.effect.value
                break
              case 'efficiency_multiplier':
                info.efficiencyMultiplier *= rule.effect.value
                break
            }

            // 记录来源
            const existingSource = info.sources.find(s => s.ruleId === rule.id)
            if (existingSource) {
              existingSource.stacks++
            } else {
              info.sources.push({ ruleId: rule.id, stacks: 1 })
            }
          }
        }
      }
    }

    // 汇总全局效果
    let resSatTotal = 0
    let resCount = 0
    const resIncomeMults: number[] = []
    const comEffMults: number[] = []
    const indEffMults: number[] = []

    for (const [key, info] of Object.entries(tileEffects)) {
      const [xStr, yStr] = key.split(',')
      const tile = map.tiles[Number(yStr)][Number(xStr)]

      if (tile.type === TileType.Residential) {
        resSatTotal += info.satisfactionMod
        resCount++
        if (info.incomeMultiplier !== 1)
          resIncomeMults.push(info.incomeMultiplier)
      }
      if (
        tile.type === TileType.Commercial &&
        info.efficiencyMultiplier !== 1
      ) {
        comEffMults.push(info.efficiencyMultiplier)
      }
      if (
        tile.type === TileType.Industrial &&
        info.efficiencyMultiplier !== 1
      ) {
        indEffMults.push(info.efficiencyMultiplier)
      }
    }

    if (resCount > 0) {
      globalSatisfactionMod = resSatTotal / resCount
    }

    if (resIncomeMults.length > 0) {
      incomeMultByType.residential =
        resIncomeMults.reduce((a, b) => a * b, 1) ** (1 / resIncomeMults.length)
    }
    if (comEffMults.length > 0) {
      effMultByType.commercial =
        comEffMults.reduce((a, b) => a * b, 1) ** (1 / comEffMults.length)
    }
    if (indEffMults.length > 0) {
      effMultByType.industrial =
        indEffMults.reduce((a, b) => a * b, 1) ** (1 / indEffMults.length)
    }

    const synergyState: SynergyState = {
      tileEffects,
      globalSatisfactionMod,
      incomeMultByType,
      effMultByType,
    }

    this.stateManager.update({ synergy: synergyState })
  }

  /** 查询单瓦片协同信息 */
  getTileSynergy(x: number, y: number): TileSynergyInfo | null {
    const state = this.stateManager.getState()
    return state.synergy.tileEffects[`${x},${y}`] ?? null
  }
}
