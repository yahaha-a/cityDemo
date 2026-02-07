import type {
  BuildingEffectState,
  TileBuildingEffect,
} from 'shared/types/building-effects'
import type { BuildingCategory } from 'shared/types/building-defs'
import { getTileBuildingId } from 'shared/types/building-compat'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem, SystemRegistry } from '../engine/system-registry'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'
import { getBuildingDef } from '../config/building-defs'
import { SYNERGY_RULES_V2 } from '../config/synergy-rules'

/** 等级乘数 */
const LEVEL_MULTIPLIER = [1, 1.8, 3.0]

/**
 * 建筑效果系统 — 替代 FacilitySystem + SynergySystem + ProductionChainSystem
 * 每日 tick 中统一计算区域效果、协同效应、资源供需
 */
export class BuildingEffectSystem implements IGameSystem {
  readonly id = 'buildingEffect'
  private stateManager: GameStateManager

  /** 协同规则半径覆盖（科技效果） */
  private radiusOverrides: Record<string, number> = {}
  private appliedOverrides = new Set<string>()

  /** 空间索引缓存 */
  private tagIndex = new Map<string, Array<{ x: number; y: number }>>()
  private lastMapRef: unknown = null

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  init(_registry: SystemRegistry): void {
    // 无跨系统依赖
  }

  processDailyTick(): void {
    const state = this.stateManager.getState()
    const { map } = state

    const tileEffects: Record<string, TileBuildingEffect> = {}
    let totalMaintenance = 0
    let totalResearchPoints = 0
    let crisisResistanceSum = 0
    let crisisResistanceCount = 0

    // 资源汇总
    let laborSupply = 0
    let laborDemand = 0
    let goodsSupply = 0
    let goodsDemand = 0
    let servicesSupply = 0
    let servicesDemand = 0

    // === Pass 1 — 区域效果（替代 FacilitySystem） ===
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]
        const buildingId = getTileBuildingId(tile)
        if (buildingId === 'empty' || buildingId === 'road') continue

        const def = getBuildingDef(buildingId)
        if (!def) continue

        // 多格建筑：只处理 origin 格，或无 structureId 的格（单格建筑）
        if (tile.structureRole === 'part') continue

        const levelMult = LEVEL_MULTIPLIER[(tile.level || 1) - 1] ?? 1

        // 累加维护费
        totalMaintenance += def.maintenance * levelMult

        // 区域效果
        if (
          def.areaRadius > 0 &&
          def.areaEffects.length > 0 &&
          tile.connected
        ) {
          const radius = def.areaRadius
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              if (dx === 0 && dy === 0) continue
              if (Math.abs(dx) + Math.abs(dy) > radius) continue

              const tx = x + dx
              const ty = y + dy
              if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT)
                continue

              const target = map.tiles[ty][tx]
              const targetId = getTileBuildingId(target)
              if (targetId === 'empty' || targetId === 'road') continue
              if (!target.connected) continue

              const targetDef = getBuildingDef(targetId)
              if (!targetDef) continue

              for (const effect of def.areaEffects) {
                // 检查 targetCategory 过滤
                if (
                  effect.targetCategory &&
                  targetDef.category !== effect.targetCategory
                )
                  continue

                const key = `${tx},${ty}`
                if (!tileEffects[key]) {
                  tileEffects[key] = {
                    satisfactionMod: 0,
                    incomeMultiplier: 1,
                    efficiencyMultiplier: 1,
                    crisisResistance: 0,
                    capacityMultiplier: 1,
                    researchPoints: 0,
                    sources: [],
                  }
                }

                const te = tileEffects[key]
                switch (effect.type) {
                  case 'satisfaction':
                    te.satisfactionMod += effect.value
                    break
                  case 'income_multiplier':
                    te.incomeMultiplier *= effect.value
                    break
                  case 'efficiency_multiplier':
                    te.efficiencyMultiplier *= effect.value
                    break
                  case 'crisis_resistance':
                    te.crisisResistance += effect.value
                    crisisResistanceSum += effect.value
                    crisisResistanceCount++
                    break
                  case 'capacity_multiplier':
                    te.capacityMultiplier *= effect.value
                    break
                  case 'research_points':
                    te.researchPoints += effect.value
                    totalResearchPoints += effect.value
                    break
                }
              }
            }
          }

          // 处理非空间效果（crisis_resistance 和 research_points 也累加在此）
          for (const effect of def.areaEffects) {
            if (effect.type === 'crisis_resistance' && !effect.targetCategory) {
              crisisResistanceSum += effect.value
              crisisResistanceCount++
            }
            if (effect.type === 'research_points' && !effect.targetCategory) {
              totalResearchPoints += effect.value
            }
          }
        }

        // === Pass 3 — 资源汇总（同时在 Pass 1 循环中处理） ===
        if (tile.connected) {
          // 产出
          if (def.produces.labor) laborSupply += def.produces.labor * levelMult
          if (def.produces.goods) goodsSupply += def.produces.goods * levelMult
          if (def.produces.services)
            servicesSupply += def.produces.services * levelMult

          // 消耗
          if (def.consumes.labor) laborDemand += def.consumes.labor * levelMult
          if (def.consumes.goods) goodsDemand += def.consumes.goods * levelMult
          if (def.consumes.services)
            servicesDemand += def.consumes.services * levelMult
        }
      }
    }

    // === Pass 2 — 协同效应（替代 SynergySystem） ===
    this.rebuildTagIndex()

    const stackCounts: Record<number, Record<string, number>> = {}

    for (const rule of SYNERGY_RULES_V2) {
      const radius = this.getEffectiveRadius(rule.id, rule.radius)
      if (radius <= 0) continue

      const sources = this.tagIndex.get(rule.sourceTag)
      if (!sources || sources.length === 0) continue

      for (const { x, y } of sources) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx === 0 && dy === 0) continue
            if (Math.abs(dx) + Math.abs(dy) > radius) continue

            const tx = x + dx
            const ty = y + dy
            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT)
              continue

            const target = map.tiles[ty][tx]
            if (!target.connected) continue

            const targetId = getTileBuildingId(target)
            const targetDef = getBuildingDef(targetId)
            if (!targetDef) continue

            // 检查目标是否包含目标 tag
            if (!targetDef.synergyTags.includes(rule.targetTag)) continue

            // 叠加上限
            const numKey = tx + ty * MAP_WIDTH
            if (!stackCounts[numKey]) stackCounts[numKey] = {}
            const current = stackCounts[numKey][rule.id] ?? 0
            if (current >= rule.maxStacks) continue
            stackCounts[numKey][rule.id] = current + 1

            const key = `${tx},${ty}`
            if (!tileEffects[key]) {
              tileEffects[key] = {
                satisfactionMod: 0,
                incomeMultiplier: 1,
                efficiencyMultiplier: 1,
                crisisResistance: 0,
                capacityMultiplier: 1,
                researchPoints: 0,
                sources: [],
              }
            }

            const te = tileEffects[key]
            switch (rule.effect.type) {
              case 'satisfaction':
                te.satisfactionMod += rule.effect.value
                break
              case 'income_multiplier':
                te.incomeMultiplier *= rule.effect.value
                break
              case 'efficiency_multiplier':
                te.efficiencyMultiplier *= rule.effect.value
                break
            }

            const existingSource = te.sources.find(s => s.ruleId === rule.id)
            if (existingSource) {
              existingSource.stacks++
            } else {
              te.sources.push({ ruleId: rule.id, stacks: 1 })
            }
          }
        }
      }
    }

    // === 汇总全局效果 ===
    let globalSatisfactionMod = 0
    const incomeMultByCategory: Record<BuildingCategory, number> = {
      residential: 1,
      commercial: 1,
      industrial: 1,
      service: 1,
    }
    const effMultByCategory: Record<BuildingCategory, number> = {
      residential: 1,
      commercial: 1,
      industrial: 1,
      service: 1,
    }

    // 按类别收集乘数（取几何平均），满意度取算术平均
    const categoryIncomeMults: Record<string, number[]> = {}
    const categoryEffMults: Record<string, number[]> = {}
    let satTotal = 0
    let satCount = 0

    for (const [key, info] of Object.entries(tileEffects)) {
      const [xStr, yStr] = key.split(',')
      const tile = map.tiles[Number(yStr)][Number(xStr)]
      const buildingId = getTileBuildingId(tile)
      const def = getBuildingDef(buildingId)
      if (!def) continue

      const cat = def.category

      if (info.satisfactionMod !== 0 && cat === 'residential') {
        satTotal += info.satisfactionMod
        satCount++
      }

      if (info.incomeMultiplier !== 1) {
        if (!categoryIncomeMults[cat]) categoryIncomeMults[cat] = []
        categoryIncomeMults[cat].push(info.incomeMultiplier)
      }

      if (info.efficiencyMultiplier !== 1) {
        if (!categoryEffMults[cat]) categoryEffMults[cat] = []
        categoryEffMults[cat].push(info.efficiencyMultiplier)
      }
    }

    if (satCount > 0) {
      globalSatisfactionMod = satTotal / satCount
    }

    for (const cat of [
      'residential',
      'commercial',
      'industrial',
      'service',
    ] as BuildingCategory[]) {
      const incomeMults = categoryIncomeMults[cat]
      if (incomeMults && incomeMults.length > 0) {
        incomeMultByCategory[cat] =
          incomeMults.reduce((a, b) => a * b, 1) ** (1 / incomeMults.length)
      }

      const effMults = categoryEffMults[cat]
      if (effMults && effMults.length > 0) {
        effMultByCategory[cat] =
          effMults.reduce((a, b) => a * b, 1) ** (1 / effMults.length)
      }
    }

    // 级联效率
    const laborFulfillment =
      laborDemand <= 0 ? 1 : Math.min(laborSupply / laborDemand, 1)
    const effectiveGoods = goodsSupply * laborFulfillment
    const goodsFulfillment =
      goodsDemand <= 0 ? 1 : Math.min(effectiveGoods / goodsDemand, 1)
    const effectiveServices = servicesSupply * goodsFulfillment
    const servicesFulfillment =
      servicesDemand <= 0 ? 1 : Math.min(effectiveServices / servicesDemand, 1)

    const avgCrisisResistance =
      crisisResistanceCount > 0
        ? crisisResistanceSum / crisisResistanceCount
        : 0

    const buildingEffects: BuildingEffectState = {
      tileEffects,
      globalSatisfactionMod,
      incomeMultByCategory,
      effMultByCategory,
      totalMaintenance,
      totalResearchPoints,
      avgCrisisResistance,
      resources: {
        laborSupply,
        laborDemand,
        laborFulfillment,
        goodsSupply,
        goodsDemand,
        goodsFulfillment,
        servicesSupply,
        servicesDemand,
        servicesFulfillment,
      },
    }

    this.stateManager.update({ buildingEffects })
  }

  /** 修改协同规则半径 */
  setRadiusOverride(ruleId: string, delta: number): void {
    const key = `${ruleId}:${delta}`
    if (this.appliedOverrides.has(key)) return
    this.appliedOverrides.add(key)
    this.radiusOverrides[ruleId] = (this.radiusOverrides[ruleId] ?? 0) + delta
  }

  private getEffectiveRadius(ruleId: string, baseRadius: number): number {
    const override = this.radiusOverrides[ruleId] ?? 0
    return Math.max(0, baseRadius + override)
  }

  /** 重建 tag 空间索引 */
  private rebuildTagIndex(): void {
    const state = this.stateManager.getState()
    const { map } = state

    if (map === this.lastMapRef) return
    this.lastMapRef = map

    this.tagIndex.clear()

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map.tiles[y][x]
        if (!tile.connected) continue

        const buildingId = getTileBuildingId(tile)
        if (buildingId === 'empty' || buildingId === 'road') continue

        // 多格建筑只处理 origin
        if (tile.structureRole === 'part') continue

        const def = getBuildingDef(buildingId)
        if (!def) continue

        for (const tag of def.synergyTags) {
          let list = this.tagIndex.get(tag)
          if (!list) {
            list = []
            this.tagIndex.set(tag, list)
          }
          list.push({ x, y })
        }
      }
    }
  }
}
