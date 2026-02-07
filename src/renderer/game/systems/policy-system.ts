import type { PolicyEffect } from 'shared/types'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem } from '../engine/system-registry'
import {
  POLICY_TEMPLATES,
  MAX_ACTIVE_POLICIES,
  POLICY_DEFAULT_COOLDOWN,
} from '../config'

/**
 * 政策系统 - 可开关的城市政策
 * 缓存 getAggregatedEffect 结果，仅在政策变更时失效
 */
export class PolicySystem implements IGameSystem {
  readonly id = 'policy'
  private stateManager: GameStateManager
  // 缓存：activePolicies 引用 → effect 类型 → 聚合值
  private cachedActivePolicies: string[] | null = null
  private effectCache = new Map<string, number>()

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  processDailyTick(): void {
    this.processDailyPolicies()
  }

  /** 使缓存失效 */
  private invalidateCache(): void {
    this.cachedActivePolicies = null
    this.effectCache.clear()
  }

  /** 每日递减冷却计时 */
  processDailyPolicies(): void {
    const state = this.stateManager.getState()
    const policies = { ...state.policies }
    const newCooldowns = { ...policies.cooldowns }
    let changed = false

    for (const [id, cd] of Object.entries(newCooldowns)) {
      if (cd > 0) {
        newCooldowns[id] = cd - 1
        changed = true
        if (newCooldowns[id] <= 0) {
          delete newCooldowns[id]
        }
      }
    }

    if (changed) {
      policies.cooldowns = newCooldowns
      this.stateManager.update({ policies })
    }
  }

  /** 切换政策开关 */
  togglePolicy(policyId: string): boolean {
    const state = this.stateManager.getState()
    const policies = { ...state.policies }
    const template = POLICY_TEMPLATES.find(t => t.id === policyId)
    if (!template) return false

    const isActive = policies.activePolicies.includes(policyId)

    if (isActive) {
      // 关闭政策
      policies.activePolicies = policies.activePolicies.filter(
        id => id !== policyId
      )
      policies.cooldowns = {
        ...policies.cooldowns,
        [policyId]: template.cooldownDays || POLICY_DEFAULT_COOLDOWN,
      }
      this.stateManager.update({ policies })
      this.invalidateCache()
      return true
    }

    // 开启政策
    if (policies.activePolicies.length >= MAX_ACTIVE_POLICIES) return false

    // 检查冷却
    if ((policies.cooldowns[policyId] ?? 0) > 0) return false

    // 检查解锁
    if (template.unlockTech) {
      if (!state.tech.researched.includes(template.unlockTech)) return false
    }

    // 检查互斥
    for (const excId of template.exclusiveWith) {
      if (policies.activePolicies.includes(excId)) return false
    }

    policies.activePolicies = [...policies.activePolicies, policyId]
    this.stateManager.update({ policies })
    this.invalidateCache()
    return true
  }

  /** 聚合指定效果类型的值（带缓存） */
  getAggregatedEffect(effectType: PolicyEffect['type']): number {
    const state = this.stateManager.getState()
    const { activePolicies } = state.policies

    // 检查缓存是否有效（引用比较）
    if (activePolicies === this.cachedActivePolicies) {
      const cached = this.effectCache.get(effectType)
      if (cached !== undefined) return cached
    } else {
      // 政策列表变了，清除所有缓存
      this.cachedActivePolicies = activePolicies
      this.effectCache.clear()
    }

    let result = effectType.includes('multiplier') ? 1 : 0

    for (const policyId of activePolicies) {
      const template = POLICY_TEMPLATES.find(t => t.id === policyId)
      if (!template) continue

      for (const effect of template.effects) {
        if (effect.type === effectType) {
          if (effectType.includes('multiplier')) {
            result *= effect.value
          } else {
            result += effect.value
          }
        }
      }
    }

    this.effectCache.set(effectType, result)
    return result
  }

  /** 获取政策模板 */
  getPolicyTemplate(id: string) {
    return POLICY_TEMPLATES.find(t => t.id === id)
  }

  /** 检查政策是否可以切换 */
  canTogglePolicy(policyId: string): { canToggle: boolean; reason?: string } {
    const state = this.stateManager.getState()
    const template = POLICY_TEMPLATES.find(t => t.id === policyId)
    if (!template) return { canToggle: false, reason: '未知政策' }

    const isActive = state.policies.activePolicies.includes(policyId)
    if (isActive) return { canToggle: true }

    if (state.policies.activePolicies.length >= MAX_ACTIVE_POLICIES) {
      return {
        canToggle: false,
        reason: `最多同时激活 ${MAX_ACTIVE_POLICIES} 项政策`,
      }
    }

    const cd = state.policies.cooldowns[policyId] ?? 0
    if (cd > 0) {
      return { canToggle: false, reason: `冷却中 (${cd}天)` }
    }

    if (
      template.unlockTech &&
      !state.tech.researched.includes(template.unlockTech)
    ) {
      return { canToggle: false, reason: '需要科技解锁' }
    }

    for (const excId of template.exclusiveWith) {
      if (state.policies.activePolicies.includes(excId)) {
        const excTemplate = POLICY_TEMPLATES.find(t => t.id === excId)
        return {
          canToggle: false,
          reason: `与「${excTemplate?.name ?? excId}」互斥`,
        }
      }
    }

    return { canToggle: true }
  }
}
