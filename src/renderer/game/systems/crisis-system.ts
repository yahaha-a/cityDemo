import type {
  TileType,
  ChallengeState,
  CrisisTemplate,
  ActiveCrisis,
} from 'shared/game-types'
import type { GameStateManager } from '../engine/game-state'
import {
  CRISIS_TEMPLATES,
  CRISIS_BASE_COOLDOWN,
  CRISIS_COOLDOWN_VARIANCE,
  CHALLENGE_DEFICIT_LIMIT,
  CHALLENGE_LOW_SAT_LIMIT,
  CHALLENGE_LOW_SAT_THRESHOLD,
  CHALLENGE_WIN_POP,
  CHALLENGE_WIN_SAT,
  CHALLENGE_WIN_DAYS,
  MAP_WIDTH,
  MAP_HEIGHT,
} from '../constants'
import type { PolicySystem } from './policy-system'

/**
 * 危机挑战系统 - 交互式危机事件和挑战模式
 */
export class CrisisSystem {
  private stateManager: GameStateManager
  private policySystem: PolicySystem | null = null
  private crisisCooldown = CRISIS_BASE_COOLDOWN

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  setPolicySystem(policySystem: PolicySystem): void {
    this.policySystem = policySystem
  }

  /** 每日危机处理 */
  processDailyCrisis(): void {
    const state = this.stateManager.getState()
    const challenge = { ...state.challenge }

    // 处理进行中的危机效果
    challenge.activeCrises = challenge.activeCrises
      .map(crisis => ({
        ...crisis,
        remainingEffects: crisis.remainingEffects
          .map(e => ({ ...e, remainingDays: e.remainingDays - 1 }))
          .filter(e => e.remainingDays > 0),
      }))
      .filter(crisis => crisis.remainingEffects.length > 0)

    // 冷却递减
    this.crisisCooldown = Math.max(0, this.crisisCooldown - 1)

    // 尝试触发新危机
    if (
      this.crisisCooldown <= 0 &&
      !challenge.pendingCrisis &&
      !challenge.gameOver
    ) {
      const crisis = this.rollCrisis(state.time.day)
      if (crisis) {
        // 检查设施是否能阻止
        if (this.canPreventCrisis(crisis)) {
          // 危机被阻止，重置冷却
          this.crisisCooldown = Math.floor(
            CRISIS_BASE_COOLDOWN * 0.5 +
              (Math.random() - 0.5) * CRISIS_COOLDOWN_VARIANCE
          )
        } else {
          challenge.pendingCrisis = crisis
        }
      }
    }

    // 挑战模式判定
    if (challenge.challengeMode && !challenge.gameOver && !challenge.gameWon) {
      this.updateChallengeConditions(challenge, state)
    }

    this.stateManager.updateChallengeSilent(challenge)
  }

  /** 响应危机选项 */
  resolveCrisis(optionId: string): boolean {
    const state = this.stateManager.getState()
    const challenge = { ...state.challenge }
    const crisis = challenge.pendingCrisis
    if (!crisis) return false

    const option = crisis.options.find(o => o.id === optionId)
    if (!option) return false

    // 检查资金
    if (option.cost > state.money) return false

    // 检查需求条件
    if (option.requirements) {
      if (option.requirements.facility) {
        if (!this.hasFacility(option.requirements.facility)) return false
      }
      if (option.requirements.tech) {
        if (!state.tech.researched.includes(option.requirements.tech))
          return false
      }
    }

    // 扣费
    if (option.cost > 0) {
      this.stateManager.spendMoney(option.cost)
    }

    // 应用效果
    let preventChain = false
    const newCrisis: ActiveCrisis = {
      templateId: crisis.id,
      name: crisis.name,
      severity: crisis.severity,
      remainingEffects: [],
    }

    for (const effect of option.effects) {
      switch (effect.type) {
        case 'satisfaction': {
          const econ = state.economy
          this.stateManager.updateEconomy({
            satisfaction: Math.max(
              0,
              Math.min(100, econ.satisfaction + effect.value)
            ),
          })
          break
        }
        case 'money':
          this.stateManager.addMoney(effect.value)
          break
        case 'population_loss': {
          const econ = state.economy
          const newPop = Math.max(0, econ.population - effect.value)
          this.stateManager.updateEconomy({ population: newPop })
          break
        }
        case 'prevent_chain':
          preventChain = true
          break
        case 'income_multiplier_temp':
        case 'industrial_multiplier_temp':
        case 'services_multiplier_temp':
          newCrisis.remainingEffects.push({
            type: effect.type,
            value: effect.value,
            remainingDays: effect.durationDays ?? 5,
          })
          break
      }
    }

    if (newCrisis.remainingEffects.length > 0) {
      challenge.activeCrises = [...challenge.activeCrises, newCrisis]
    }

    // 连锁事件
    if (
      !preventChain &&
      crisis.chainEventId &&
      crisis.chainProbability &&
      Math.random() < crisis.chainProbability
    ) {
      const chainTemplate = CRISIS_TEMPLATES.find(
        t => t.id === crisis.chainEventId
      )
      if (chainTemplate) {
        challenge.pendingCrisis = chainTemplate
        this.stateManager.updateChallenge(challenge)
        return true
      }
    }

    challenge.pendingCrisis = null
    this.crisisCooldown =
      CRISIS_BASE_COOLDOWN +
      Math.floor((Math.random() - 0.5) * 2 * CRISIS_COOLDOWN_VARIANCE)

    this.stateManager.updateChallenge(challenge)
    return true
  }

  /** 获取危机的活跃乘数 */
  getActiveMultiplier(type: string): number {
    const state = this.stateManager.getState()
    let mult = 1
    for (const crisis of state.challenge.activeCrises) {
      for (const effect of crisis.remainingEffects) {
        if (effect.type === type) {
          mult *= effect.value
        }
      }
    }
    return mult
  }

  /** 切换挑战模式 */
  toggleChallengeMode(): void {
    const state = this.stateManager.getState()
    const challenge = { ...state.challenge }
    challenge.challengeMode = !challenge.challengeMode
    challenge.gameOver = false
    challenge.gameWon = false
    challenge.score = 0
    challenge.deficitDays = 0
    challenge.lowSatisfactionDays = 0
    challenge.winProgress = 0
    this.stateManager.updateChallenge(challenge)
  }

  private rollCrisis(currentDay: number): CrisisTemplate | null {
    const crisisFreqMult =
      this.policySystem?.getAggregatedEffect('crisis_frequency_multiplier') ?? 1

    const available = CRISIS_TEMPLATES.filter(t => {
      if (currentDay < t.minDay) return false
      return true
    })

    if (available.length === 0) return null

    // 按概率加权选择
    for (const template of available) {
      const prob = template.baseProbability * crisisFreqMult
      if (Math.random() < prob) return template
    }

    return null
  }

  private canPreventCrisis(crisis: CrisisTemplate): boolean {
    if (
      !crisis.preventedByFacilities ||
      crisis.preventedByFacilities.length === 0
    ) {
      return false
    }

    const state = this.stateManager.getState()
    const avgResistance = state.facilities.avgCrisisResistance
    return avgResistance >= (crisis.preventionThreshold ?? 0.5)
  }

  private hasFacility(facilityType: TileType): boolean {
    const state = this.stateManager.getState()
    const { map } = state
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (
          map.tiles[y][x].type === facilityType &&
          map.tiles[y][x].connected
        ) {
          return true
        }
      }
    }
    return false
  }

  private updateChallengeConditions(
    challenge: ChallengeState,
    state: import('shared/game-types').GameState
  ): void {
    const { economy, time } = state

    // 败北条件: 连续赤字
    if (economy.lastDayRevenue < 0) {
      challenge.deficitDays++
    } else {
      challenge.deficitDays = 0
    }

    if (challenge.deficitDays >= CHALLENGE_DEFICIT_LIMIT) {
      challenge.gameOver = true
      challenge.score = this.calculateScore(state)
      return
    }

    // 败北条件: 满意度低
    if (economy.satisfaction < CHALLENGE_LOW_SAT_THRESHOLD) {
      challenge.lowSatisfactionDays++
    } else {
      challenge.lowSatisfactionDays = 0
    }

    if (challenge.lowSatisfactionDays >= CHALLENGE_LOW_SAT_LIMIT) {
      challenge.gameOver = true
      challenge.score = this.calculateScore(state)
      return
    }

    // 败北条件: 人口归零（至少50天后）
    if (economy.population <= 0 && time.day > 50) {
      challenge.gameOver = true
      challenge.score = this.calculateScore(state)
      return
    }

    // 胜利条件
    if (
      economy.population >= CHALLENGE_WIN_POP &&
      economy.satisfaction >= CHALLENGE_WIN_SAT
    ) {
      challenge.winProgress++
    } else {
      challenge.winProgress = 0
    }

    if (challenge.winProgress >= CHALLENGE_WIN_DAYS) {
      challenge.gameWon = true
      challenge.score = this.calculateScore(state)
    }
  }

  private calculateScore(state: import('shared/game-types').GameState): number {
    const { economy, time, money } = state
    return Math.floor(
      economy.population * 10 +
        time.day * 5 +
        money * 0.1 +
        economy.satisfaction * 20
    )
  }
}
