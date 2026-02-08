import type { EventModifierTarget, EventState, GameEvent } from 'shared/types'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem } from '../engine/system-registry'
import {
  EVENT_BASE_COOLDOWN,
  EVENT_COOLDOWN_VARIANCE,
  EVENT_HISTORY_SIZE,
  EVENT_TEMPLATES,
} from '../config'

/**
 * 事件系统 - 随机事件触发和管理
 */
export class EventSystem implements IGameSystem {
  readonly id = 'event'
  private stateManager: GameStateManager

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  processDailyTick(): void {
    this.processDailyEvents()
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

  /** 获取活跃事件对特定危机的概率修正乘数 */
  getCrisisModifier(crisisId: string): number {
    const state = this.stateManager.getState()
    let mult = 1
    for (const event of state.events.activeEvents) {
      const template = EVENT_TEMPLATES.find(t => t.id === event.id)
      if (!template?.crisisModifiers) continue
      for (const cm of template.crisisModifiers) {
        if (cm.crisisId === crisisId) {
          mult *= cm.multiplier
        }
      }
    }
    return mult
  }

  /** 触发指定事件（供危机后续联动调用） */
  triggerEvent(eventId: string): void {
    const state = this.stateManager.getState()
    const template = EVENT_TEMPLATES.find(t => t.id === eventId)
    if (!template) return

    const events = { ...state.events }
    // 如果该事件已经活跃，不重复触发
    if (events.activeEvents.some(e => e.id === eventId)) return

    const duration =
      template.durationMin +
      Math.floor(
        Math.random() * (template.durationMax - template.durationMin + 1)
      )

    const newEvent: GameEvent = {
      id: template.id,
      name: template.name,
      description: template.description,
      durationDays: duration,
      remainingDays: duration,
      modifiers: [...template.modifiers],
    }

    events.activeEvents = [...events.activeEvents, newEvent]
    events.eventHistory = [newEvent.id, ...events.eventHistory].slice(
      0,
      EVENT_HISTORY_SIZE
    )

    this.stateManager.update({ events })
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
