import type { TileType, TechState } from 'shared/types'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem, SystemRegistry } from '../engine/system-registry'
import { TECH_TREE } from '../config'
import type { PolicySystem } from './policy-system'
import type { BuildingEffectSystem } from './building-effect-system'
import type { SpecializationSystem } from './specialization-system'

/**
 * 科技树系统 - 研究点生成和科技解锁
 */
export class TechSystem implements IGameSystem {
  readonly id = 'tech'
  private stateManager: GameStateManager
  private policySystem!: PolicySystem
  private buildingEffectSystem!: BuildingEffectSystem
  private specializationSystem!: SpecializationSystem

  constructor(stateManager: GameStateManager, policySystem?: PolicySystem) {
    this.stateManager = stateManager
    if (policySystem) this.policySystem = policySystem
  }

  init(registry: SystemRegistry): void {
    this.policySystem = registry.get<PolicySystem>('policy')
    this.buildingEffectSystem =
      registry.get<BuildingEffectSystem>('buildingEffect')
    this.specializationSystem =
      registry.get<SpecializationSystem>('specialization')
  }

  processDailyTick(): void {
    this.processDailyTech()
  }

  /** 每日科技处理 */
  processDailyTech(): void {
    const state = this.stateManager.getState()
    const tech = { ...state.tech }

    // 计算每日研究点
    const dailyRP = this.calculateDailyRP()
    tech.dailyRP = dailyRP

    // 推进当前研究
    if (tech.currentResearch && dailyRP > 0) {
      tech.researchProgress += dailyRP

      const node = TECH_TREE.find(t => t.id === tech.currentResearch)
      if (node && tech.researchProgress >= node.rpCost) {
        // 研究完成
        tech.researched = [...tech.researched, node.id]
        tech.currentResearch = null
        tech.researchProgress = 0

        // 应用效果
        this.applyTechEffects(node.id, tech)
      }
    }

    this.stateManager.update({ tech })
  }

  /** 设置当前研究目标 */
  setResearch(techId: string): boolean {
    const state = this.stateManager.getState()
    const tech = { ...state.tech }

    const node = TECH_TREE.find(t => t.id === techId)
    if (!node) return false

    // 已经研究过
    if (tech.researched.includes(techId)) return false

    // 检查前置
    for (const prereq of node.prerequisites) {
      if (!tech.researched.includes(prereq)) return false
    }

    tech.currentResearch = techId
    tech.researchProgress = 0
    this.stateManager.update({ tech })
    return true
  }

  /** 取消当前研究 */
  cancelResearch(): void {
    const state = this.stateManager.getState()
    const tech = { ...state.tech }
    tech.currentResearch = null
    tech.researchProgress = 0
    this.stateManager.update({ tech })
  }

  /** 检查科技是否可研究 */
  canResearch(techId: string): boolean {
    const state = this.stateManager.getState()
    const node = TECH_TREE.find(t => t.id === techId)
    if (!node) return false
    if (state.tech.researched.includes(techId)) return false

    for (const prereq of node.prerequisites) {
      if (!state.tech.researched.includes(prereq)) return false
    }
    return true
  }

  /** 获取科技节点 */
  getTechNode(id: string) {
    return TECH_TREE.find(t => t.id === id)
  }

  /** 获取研究进度百分比 */
  getResearchProgress(): number {
    const state = this.stateManager.getState()
    if (!state.tech.currentResearch) return 0
    const node = TECH_TREE.find(t => t.id === state.tech.currentResearch)
    if (!node) return 0
    return Math.min(1, state.tech.researchProgress / node.rpCost)
  }

  private calculateDailyRP(): number {
    const state = this.stateManager.getState()
    const { economy, buildingEffects } = state

    // 基础 RP: 人口 / 50 * 2
    const popRP = Math.floor(economy.population / 50) * 2

    // 学校 RP
    const schoolRP = buildingEffects.totalResearchPoints

    // 政策乘数
    const policyMult =
      this.policySystem.getAggregatedEffect('research_multiplier') ?? 1

    // 科技乘数
    let techMult = 1
    for (const [key, value] of Object.entries(
      state.tech.permanentMultipliers
    )) {
      if (key === 'research') techMult *= value
    }

    // 特色乘数
    const specMult =
      this.specializationSystem.getEffectValue('research_multiplier') ?? 1

    return Math.floor((popRP + schoolRP) * policyMult * techMult * specMult)
  }

  private applyTechEffects(techId: string, tech: TechState): void {
    const node = TECH_TREE.find(t => t.id === techId)
    if (!node) return

    for (const effect of node.effects) {
      switch (effect.type) {
        case 'unlock_building': {
          if (!effect.target) break
          const tileType = effect.target as TileType
          if (!tech.unlockedBuildings.includes(tileType)) {
            tech.unlockedBuildings = [...tech.unlockedBuildings, tileType]
          }
          break
        }
        case 'unlock_policy': {
          if (!effect.target) break
          if (!tech.unlockedPolicies.includes(effect.target)) {
            tech.unlockedPolicies = [...tech.unlockedPolicies, effect.target]
          }
          break
        }
        case 'permanent_multiplier': {
          if (!effect.target || effect.value === undefined) break
          tech.permanentMultipliers = {
            ...tech.permanentMultipliers,
            [effect.target]:
              (tech.permanentMultipliers[effect.target] ?? 1) * effect.value,
          }
          break
        }
        case 'unlock_specialization': {
          if (!effect.target) break
          const state = this.stateManager.getState()
          const spec = { ...state.specialization }
          if (!spec.available.includes(effect.target)) {
            spec.available = [...spec.available, effect.target]
            this.stateManager.update({ specialization: spec })
          }
          if (!tech.unlockedSpecializations.includes(effect.target)) {
            tech.unlockedSpecializations = [
              ...tech.unlockedSpecializations,
              effect.target,
            ]
          }
          break
        }
        case 'increase_synergy_radius': {
          if (!effect.target || effect.value === undefined) break
          this.buildingEffectSystem.setRadiusOverride(
            effect.target,
            effect.value
          )
          break
        }
        case 'research_multiplier': {
          if (effect.value === undefined) break
          tech.permanentMultipliers = {
            ...tech.permanentMultipliers,
            research: (tech.permanentMultipliers.research ?? 1) * effect.value,
          }
          break
        }
      }
    }
  }
}
