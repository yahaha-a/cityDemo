import type {
  EventModifierTarget,
  EventState,
  GameEvent,
} from 'shared/game-types'
import type { GameStateManager } from '../engine/game-state'
import {
  EVENT_BASE_COOLDOWN,
  EVENT_COOLDOWN_VARIANCE,
  EVENT_HISTORY_SIZE,
  EVENT_TEMPLATES,
} from '../constants'

/**
 * 事件系统 - 随机事件触发和管理
 */
export class EventSystem {
  private stateManager: GameStateManager

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  /** 每日事件处理 */
  processDailyEvents(): void {
    const state = this.stateManager.getState()
    const events = { ...state.events }
    const day = state.time.day

    // 递减活跃事件的剩余天数，清理过期事件
    events.activeEvents = events.activeEvents
      .map(e => ({ ...e, remainingDays: e.remainingDays - 1 }))
      .filter(e => e.remainingDays > 0)

    // 递减冷却
    events.eventCooldown = Math.max(0, events.eventCooldown - 1)

    // 冷却到 0 且没有活跃事件时，尝试触发新事件
    if (events.eventCooldown <= 0 && events.activeEvents.length === 0) {
      const newEvent = this.rollNewEvent(day, events)
      if (newEvent) {
        events.activeEvents.push(newEvent)
        // 记录历史
        events.eventHistory = [newEvent.id, ...events.eventHistory].slice(
          0,
          EVENT_HISTORY_SIZE
        )
        // 重置冷却
        events.eventCooldown =
          EVENT_BASE_COOLDOWN +
          Math.floor((Math.random() - 0.5) * 2 * EVENT_COOLDOWN_VARIANCE)
      }
    }

    this.stateManager.update({ events })
  }

  /** 获取某个指标的累积乘数 */
  getActiveMultiplier(target: EventModifierTarget): number {
    const state = this.stateManager.getState()
    let mult = 1
    for (const event of state.events.activeEvents) {
      for (const mod of event.modifiers) {
        if (mod.target === target) {
          mult *= mod.multiplier
        }
      }
    }
    return mult
  }

  /** 里程碑解锁事件 */
  unlockEvent(eventId: string): void {
    const state = this.stateManager.getState()
    const events = { ...state.events }
    if (!events.unlockedEventIds.includes(eventId)) {
      events.unlockedEventIds = [...events.unlockedEventIds, eventId]
      this.stateManager.update({ events })
    }
  }

  private rollNewEvent(
    currentDay: number,
    events: EventState
  ): GameEvent | null {
    // 筛选可用事件
    const available = EVENT_TEMPLATES.filter(t => {
      if (currentDay < t.minDay) return false
      if (events.eventHistory.includes(t.id)) return false
      if (!t.unlockedByDefault && !events.unlockedEventIds.includes(t.id))
        return false
      return true
    })

    if (available.length === 0) return null

    const template = available[Math.floor(Math.random() * available.length)]
    const duration =
      template.durationMin +
      Math.floor(
        Math.random() * (template.durationMax - template.durationMin + 1)
      )

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      durationDays: duration,
      remainingDays: duration,
      modifiers: [...template.modifiers],
    }
  }
}
