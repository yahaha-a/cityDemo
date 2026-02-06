import type { EventModifierTarget } from 'shared/game-types'

export const EVENT_BASE_COOLDOWN = 30
export const EVENT_COOLDOWN_VARIANCE = 10
export const EVENT_HISTORY_SIZE = 3

export interface EventTemplate {
  id: string
  name: string
  description: string
  minDay: number
  durationMin: number
  durationMax: number
  modifiers: Array<{ target: EventModifierTarget; multiplier: number }>
  unlockedByDefault: boolean
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: 'trade_boom',
    name: '贸易繁荣',
    description: '商品需求暴增，商业利润翻倍',
    minDay: 10,
    durationMin: 8,
    durationMax: 12,
    modifiers: [
      { target: 'goodsDemandMultiplier', multiplier: 1.5 },
      { target: 'incomeMultiplier', multiplier: 1.3 },
    ],
    unlockedByDefault: true,
  },
  {
    id: 'labor_shortage',
    name: '劳动力短缺',
    description: '工人罢工，劳动力供给减少',
    minDay: 15,
    durationMin: 8,
    durationMax: 15,
    modifiers: [{ target: 'laborSupplyMultiplier', multiplier: 0.7 }],
    unlockedByDefault: true,
  },
  {
    id: 'road_decay',
    name: '道路老化',
    description: '基础设施维护费用激增',
    minDay: 20,
    durationMin: 10,
    durationMax: 15,
    modifiers: [{ target: 'roadMaintenanceMultiplier', multiplier: 2.5 }],
    unlockedByDefault: true,
  },
  {
    id: 'industrial_boom',
    name: '工业革命',
    description: '新技术提升工业产出',
    minDay: 25,
    durationMin: 10,
    durationMax: 15,
    modifiers: [{ target: 'goodsSupplyMultiplier', multiplier: 1.5 }],
    unlockedByDefault: true,
  },
  {
    id: 'service_demand',
    name: '服务热潮',
    description: '市民对服务需求大增',
    minDay: 15,
    durationMin: 8,
    durationMax: 12,
    modifiers: [{ target: 'servicesDemandMultiplier', multiplier: 1.5 }],
    unlockedByDefault: true,
  },
  {
    id: 'golden_age',
    name: '黄金时代',
    description: '城市进入繁荣期，收入大幅增长',
    minDay: 50,
    durationMin: 10,
    durationMax: 15,
    modifiers: [
      { target: 'incomeMultiplier', multiplier: 2.0 },
      { target: 'laborSupplyMultiplier', multiplier: 1.2 },
    ],
    unlockedByDefault: false,
  },
  {
    id: 'economic_crisis',
    name: '经济危机',
    description: '全面衰退，所有供给下降',
    minDay: 60,
    durationMin: 10,
    durationMax: 15,
    modifiers: [
      { target: 'goodsSupplyMultiplier', multiplier: 0.6 },
      { target: 'servicesSupplyMultiplier', multiplier: 0.6 },
      { target: 'incomeMultiplier', multiplier: 0.5 },
    ],
    unlockedByDefault: false,
  },
]
