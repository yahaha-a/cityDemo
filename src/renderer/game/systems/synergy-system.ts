import {
  TileType,
  type SynergyState,
  type TileSynergyInfo,
} from 'shared/game-types'
import type { GameStateManager } from '../engine/game-state'
import { MAP_WIDTH, MAP_HEIGHT, SYNERGY_RULES } from '../constants'

/**
 * 邻接协同系统 - 计算建筑间的正面/负面邻接效应
 */
export class SynergySystem {
  private stateManager: GameStateManager
  private radiusOverrides: Record<string, number> = {}

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  /** 修改协同规则半径（用于科技效果） */
  setRadiusOverride(ruleId: string, delta: number): void {
    this.radiusOverrides[ruleId] = (this.radiusOverrides[ruleId] ?? 0) + delta
  }

  /** 获取规则的有效半径 */
  private getEffectiveRadius(ruleId: string, baseRadius: number): number {
    const override = this.radiusOverrides[ruleId] ?? 0
    return Math.max(0, baseRadius + override)
  }

  /** 每日计算所有协同效果 */
  processDailySynergy(): void {
    const state = this.stateManager.getState()
    const { map } = state
    const tileEffects: Record<string, TileSynergyInfo> = {}

    // 全局汇总
    let globalSatisfactionMod = 0
    const incomeMultByType = { residential: 1, commercial: 1, industrial: 1 }
    const effMultByType = { residential: 1, commercial: 1, industrial: 1 }

    // 统计各规则对每个瓦片的影响叠加数
    const stackCounts: Record<string, Record<string, number>> = {}

    for (const rule of SYNERGY_RULES) {
      const radius = this.getEffectiveRadius(rule.id, rule.radius)
      if (radius <= 0) continue

      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          const tile = map.tiles[y][x]
          if (tile.type !== rule.sourceTileType || !tile.connected) continue

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

              const key = `${tx},${ty}`
              if (!stackCounts[key]) stackCounts[key] = {}
              const current = stackCounts[key][rule.id] ?? 0
              if (current >= rule.maxStacks) continue
              stackCounts[key][rule.id] = current + 1

              // 初始化效果
              if (!tileEffects[key]) {
                tileEffects[key] = {
                  satisfactionMod: 0,
                  incomeMultiplier: 1,
                  efficiencyMultiplier: 1,
                  sources: [],
                }
              }

              const info = tileEffects[key]
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
              const existingSource = info.sources.find(
                s => s.ruleId === rule.id
              )
              if (existingSource) {
                existingSource.stacks++
              } else {
                info.sources.push({ ruleId: rule.id, stacks: 1 })
              }
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

    this.stateManager.updateSynergy(synergyState)
  }

  /** 查询单瓦片协同信息 */
  getTileSynergy(x: number, y: number): TileSynergyInfo | null {
    const state = this.stateManager.getState()
    return state.synergy.tileEffects[`${x},${y}`] ?? null
  }
}
