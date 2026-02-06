/** 事件修饰器目标类型 */
export type EventModifierTarget =
  | 'goodsDemandMultiplier'
  | 'servicesDemandMultiplier'
  | 'laborSupplyMultiplier'
  | 'incomeMultiplier'
  | 'roadMaintenanceMultiplier'
  | 'goodsSupplyMultiplier'
  | 'servicesSupplyMultiplier'
  | 'laborDemandMultiplier'

export interface GameEvent {
  id: string
  name: string
  description: string
  durationDays: number
  remainingDays: number
  modifiers: Array<{ target: EventModifierTarget; multiplier: number }>
}

export interface EventState {
  activeEvents: GameEvent[]
  eventCooldown: number
  eventHistory: string[]
  unlockedEventIds: string[]
}
