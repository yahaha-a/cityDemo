import type { MilestoneState, MilestoneReward } from 'shared/types'
import { getTileBuildingId } from 'shared/types/building-compat'
import { getBuildingDef } from '../config/building-defs'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem, SystemRegistry } from '../engine/system-registry'
import type { EventSystem } from './event-system'
import { MILESTONES, SATISFACTION_STREAK_THRESHOLD } from '../config'
import { MAP_WIDTH, MAP_HEIGHT } from '../config'

/**
 * 里程碑系统 - 目标追踪和奖励发放
 */
export class MilestoneSystem implements IGameSystem {
  readonly id = 'milestone'
  private stateManager: GameStateManager
  private eventSystem!: EventSystem

  constructor(stateManager: GameStateManager, eventSystem?: EventSystem) {
    this.stateManager = stateManager
    if (eventSystem) this.eventSystem = eventSystem
  }

  init(registry: SystemRegistry): void {
    this.eventSystem = registry.get<EventSystem>('event')
  }

  processDailyTick(): void {
    this.processDailyMilestones()
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
          const { map } = state
          let buildingCount = 0
          for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
              const tile = map.tiles[y][x]
              const bid = getTileBuildingId(tile)
              if (bid === 'empty' || bid === 'road') continue
              const def = getBuildingDef(bid)
              if (!def) continue
              // 多格建筑只计算 origin
              if (tile.structureRole === 'part') continue
              buildingCount++
            }
          }
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

    this.stateManager.update({ milestones: ms })
  }

  /** 消费一条待处理奖励通知 */
  consumePendingReward(): MilestoneReward | null {
    const state = this.stateManager.getState()
    const ms = { ...state.milestones }
    if (ms.pendingRewards.length === 0) return null

    const [reward, ...rest] = ms.pendingRewards
    ms.pendingRewards = rest
    this.stateManager.update({ milestones: ms })
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
      case 'unlock_building':
        // 里程碑解锁的建筑记录到 milestones.achieved 中
        // 建筑系统通过 achievedMilestones 查找关联的 buildingId
        if (reward.value) {
          this.stateManager.addMoney(reward.value)
        }
        break
    }
  }
}
