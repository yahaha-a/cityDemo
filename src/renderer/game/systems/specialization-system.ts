import type { SpecializationState } from 'shared/game-types'
import type { GameStateManager } from '../engine/game-state'
import { SPECIALIZATION_TEMPLATES } from '../constants'

/**
 * 城市特色系统 - 一次性不可逆的城市定位选择
 */
export class SpecializationSystem {
  private stateManager: GameStateManager

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  /** 选择城市特色（不可逆） */
  chooseSpecialization(specId: string): boolean {
    const state = this.stateManager.getState()
    if (state.specialization.chosen) return false

    const template = SPECIALIZATION_TEMPLATES.find(t => t.id === specId)
    if (!template) return false

    // 检查是否已解锁
    if (!state.specialization.available.includes(specId)) return false

    const spec: SpecializationState = {
      chosen: specId,
      available: state.specialization.available,
    }
    this.stateManager.updateSpecialization(spec)
    return true
  }

  /** 获取当前特色效果乘数 */
  getEffectValue(effectType: string): number {
    const state = this.stateManager.getState()
    if (!state.specialization.chosen) {
      return effectType.includes('multiplier') ? 1 : 0
    }

    const template = SPECIALIZATION_TEMPLATES.find(
      t => t.id === state.specialization.chosen
    )
    if (!template) return effectType.includes('multiplier') ? 1 : 0

    let result = effectType.includes('multiplier') ? 1 : 0
    for (const effect of template.effects) {
      if (effect.type === effectType) {
        if (effectType.includes('multiplier')) {
          result *= effect.value
        } else {
          result += effect.value
        }
      }
    }
    return result
  }

  /** 获取特色模板 */
  getTemplate(id: string) {
    return SPECIALIZATION_TEMPLATES.find(t => t.id === id)
  }
}
