import type { Milestone } from 'shared/types'

export const SATISFACTION_STREAK_THRESHOLD = 70

export const MILESTONES: Milestone[] = [
  {
    id: 'pop_50',
    name: '初具规模',
    description: '人口达到 50',
    condition: { type: 'population', threshold: 50 },
    reward: { type: 'bonus_money', value: 500 },
  },
  {
    id: 'pop_100',
    name: '小镇崛起',
    description: '人口达到 100',
    condition: { type: 'population', threshold: 100 },
    reward: { type: 'bonus_money', value: 1500 },
  },
  {
    id: 'pop_300',
    name: '城市雏形',
    description: '人口达到 300',
    condition: { type: 'population', threshold: 300 },
    reward: { type: 'bonus_money', value: 5000 },
  },
  {
    id: 'happy_7',
    name: '安居乐业',
    description: '满意度连续 7 天 >=70',
    condition: { type: 'satisfaction_streak', threshold: 70, streakDays: 7 },
    reward: { type: 'unlock_upgrade_lv3' },
  },
  {
    id: 'happy_14',
    name: '幸福之城',
    description: '满意度连续 14 天 >=70',
    condition: { type: 'satisfaction_streak', threshold: 70, streakDays: 14 },
    reward: { type: 'unlock_event', eventId: 'golden_age' },
  },
  {
    id: 'income_5000',
    name: '日进斗金',
    description: '累计收入达到 5000',
    condition: { type: 'total_income', threshold: 5000 },
    reward: { type: 'bonus_money', value: 2000 },
  },
  {
    id: 'income_20000',
    name: '富甲一方',
    description: '累计收入达到 20000',
    condition: { type: 'total_income', threshold: 20000 },
    reward: { type: 'unlock_event', eventId: 'economic_crisis' },
  },
  {
    id: 'buildings_20',
    name: '建筑大师',
    description: '拥有 20 栋建筑（不含道路）',
    condition: { type: 'building_count', threshold: 20 },
    reward: { type: 'bonus_money', value: 1000 },
  },
  {
    id: 'day_50',
    name: '半百之城',
    description: '城市存续 50 天',
    condition: { type: 'day_reached', threshold: 50 },
    reward: { type: 'bonus_money', value: 3000 },
  },
  {
    id: 'day_100',
    name: '百日庆典',
    description: '城市存续 100 天',
    condition: { type: 'day_reached', threshold: 100 },
    reward: { type: 'bonus_money', value: 8000 },
  },
]
