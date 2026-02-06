import {
  TileType,
  type MilestoneState,
  type MilestoneReward,
} from 'shared/game-types'
import type { GameStateManager } from '../engine/game-state'
import type { EventSystem } from './event-system'
import type { MapSystem } from './map-system'
import { MILESTONES, SATISFACTION_STREAK_THRESHOLD } from '../constants'

/**
 * 里程碑系统 - 目标追踪和奖励发放
 */
export class MilestoneSystem {
  private stateManager: GameStateManager
  private eventSystem: EventSystem
  private mapSystem: MapSystem

  constructor(
    stateManager: GameStateManager,
    eventSystem: EventSystem,
    mapSystem: MapSystem
  ) {
    this.stateManager = stateManager
    this.eventSystem = eventSystem
    this.mapSystem = mapSystem
  }

  /** 每日里程碑检查 */
  processDailyMilestones(): void {
    const state = this.stateManager.getState()
    const { economy, time } = state
    const ms = { ...state.milestones }

    // 累加收入
    if (economy.lastDayRevenue > 0) {
      ms.cumulativeIncome += economy.lastDayRevenue
    }

    // 更新满意度连续天
    if (economy.satisfaction >= SATISFACTION_STREAK_THRESHOLD) {
      ms.satisfactionStreak += 1
    } else {
      ms.satisfactionStreak = 0
    }

    // 检查每个未达成的里程碑
    const newRewards: MilestoneReward[] = []

    for (const milestone of MILESTONES) {
      if (ms.achieved.includes(milestone.id)) continue

      let met = false
      const { condition } = milestone

      switch (condition.type) {
        case 'population':
          met = economy.population >= condition.threshold
          break
        case 'satisfaction_streak':
          met =
            ms.satisfactionStreak >=
            (condition.streakDays ?? condition.threshold)
          break
        case 'total_income':
          met = ms.cumulativeIncome >= condition.threshold
          break
        case 'building_count': {
          const counts = this.mapSystem.countTiles()
          const buildingCount =
            counts[TileType.Residential] +
            counts[TileType.Commercial] +
            counts[TileType.Industrial]
          met = buildingCount >= condition.threshold
          break
        }
        case 'day_reached':
          met = time.day >= condition.threshold
          break
      }

      if (met) {
        ms.achieved = [...ms.achieved, milestone.id]
        newRewards.push(milestone.reward)
      }
    }

    // 发放奖励
    for (const reward of newRewards) {
      this.applyReward(reward, ms)
    }

    // 合并待消费奖励通知
    ms.pendingRewards = [...ms.pendingRewards, ...newRewards]

    this.stateManager.updateMilestones(ms)
  }

  /** 消费一条待处理奖励通知 */
  consumePendingReward(): MilestoneReward | null {
    const state = this.stateManager.getState()
    const ms = { ...state.milestones }
    if (ms.pendingRewards.length === 0) return null

    const [reward, ...rest] = ms.pendingRewards
    ms.pendingRewards = rest
    this.stateManager.updateMilestones(ms)
    return reward
  }

  private applyReward(reward: MilestoneReward, ms: MilestoneState): void {
    switch (reward.type) {
      case 'bonus_money':
        if (reward.value) {
          this.stateManager.addMoney(reward.value)
        }
        break
      case 'unlock_upgrade_lv3':
        ms.upgradeLv3Unlocked = true
        break
      case 'unlock_event':
        if (reward.eventId) {
          this.eventSystem.unlockEvent(reward.eventId)
        }
        break
    }
  }
}
