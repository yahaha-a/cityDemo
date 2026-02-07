import { TimeSpeed } from 'shared/types'
import type { GameStateManager } from './game-state'
import type { SystemRegistry } from './system-registry'
import { BuildQuery, type HoverValidity } from '../services/build-query'
import { DAY_DURATION_MS, TIME_SPEED_MULTIPLIERS } from '../config'

export type { HoverValidity }

/**
 * 游戏主循环 - requestAnimationFrame
 *
 * 仅负责时间推进和系统 tick，渲染由 R3F 自行管理
 */
export class GameLoop {
  private stateManager: GameStateManager
  private registry: SystemRegistry
  private buildQuery = new BuildQuery()
  private animFrameId = 0
  private running = false
  private lastTimestamp = 0
  private frameCallbacks = new Set<(dayProgress: number) => void>()
  private _hoverValidity: HoverValidity = 'none'

  constructor(stateManager: GameStateManager, registry: SystemRegistry) {
    this.stateManager = stateManager
    this.registry = registry
  }

  /** 当前悬停有效性（供 3D 场景读取） */
  get hoverValidity(): HoverValidity {
    return this._hoverValidity
  }

  /** 注册每帧回调（返回取消函数） */
  onFrame(cb: (dayProgress: number) => void): () => void {
    this.frameCallbacks.add(cb)
    return () => {
      this.frameCallbacks.delete(cb)
    }
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTimestamp = performance.now()
    this.tick()
  }

  stop(): void {
    this.running = false
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = 0
    }
  }

  private tick = (): void => {
    if (!this.running) return

    const now = performance.now()
    const deltaMs = now - this.lastTimestamp
    this.lastTimestamp = now

    // 更新时间系统
    this.updateTime(deltaMs)

    // 计算日进度并通知帧回调
    const state = this.stateManager.getState()
    const dayProgress = Math.min(
      state.time.tickAccumulator / DAY_DURATION_MS,
      1
    )
    for (const cb of this.frameCallbacks) {
      cb(dayProgress)
    }

    // 更新悬停有效性
    this._hoverValidity = this.buildQuery.getHoverValidity(state)

    this.animFrameId = requestAnimationFrame(this.tick)
  }

  private updateTime(deltaMs: number): void {
    const state = this.stateManager.getState()
    const { time } = state

    if (time.speed === TimeSpeed.Paused) return

    // 如果有待处理的危机，暂停时间推进
    if (state.challenge.pendingCrisis) return

    const speedMultiplier = TIME_SPEED_MULTIPLIERS[time.speed]
    let remaining = time.tickAccumulator + deltaMs * speedMultiplier

    // 限制单帧最多推进 10 天，避免切标签页回来导致大量计算
    const maxDays = 10
    let daysAdvanced = 0

    while (remaining >= DAY_DURATION_MS && daysAdvanced < maxDays) {
      remaining -= DAY_DURATION_MS

      // 每日处理包在 batch 中，一天只触发一次 React 重渲染
      this.stateManager.batch(() => {
        this.stateManager.advanceDay()
        this.registry.tickAll()
      })
      daysAdvanced++

      // 如果危机弹出，暂停后续推进
      const currentState = this.stateManager.getState()
      if (currentState.challenge.pendingCrisis) {
        remaining = 0
        break
      }
    }

    if (daysAdvanced >= maxDays) {
      remaining = 0
    }

    this.stateManager.setTickAccumulator(remaining)
  }
}
