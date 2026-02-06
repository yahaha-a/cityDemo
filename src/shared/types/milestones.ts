import type { TileType } from './core'

export interface MilestoneCondition {
  type:
    | 'population'
    | 'satisfaction_streak'
    | 'total_income'
    | 'building_count'
    | 'day_reached'
  threshold: number
  buildingType?: TileType
  streakDays?: number
}

export interface MilestoneReward {
  type: 'bonus_money' | 'unlock_upgrade_lv3' | 'unlock_event'
  value?: number
  eventId?: string
}

export interface Milestone {
  id: string
  name: string
  description: string
  condition: MilestoneCondition
  reward: MilestoneReward
}

export interface MilestoneState {
  achieved: string[]
  satisfactionStreak: number
  cumulativeIncome: number
  upgradeLv3Unlocked: boolean
  pendingRewards: MilestoneReward[]
}
