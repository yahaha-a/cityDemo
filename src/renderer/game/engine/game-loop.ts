import { TimeSpeed } from 'shared/game-types'
import type { GameStateManager } from './game-state'
import type { IsometricRenderer } from '../renderer/isometric-renderer'
import type { EconomySystem } from '../systems/economy-system'
import { DAY_DURATION_MS, TIME_SPEED_MULTIPLIERS } from '../constants'

/**
 * 游戏主循环 - requestAnimationFrame
 */
export class GameLoop {
  private renderer: IsometricRenderer
  private stateManager: GameStateManager
  private economySystem: EconomySystem
  private animFrameId = 0
  private running = false
  private lastTimestamp = 0

  constructor(
    renderer: IsometricRenderer,
    stateManager: GameStateManager,
    economySystem: EconomySystem
  ) {
    this.renderer = renderer
    this.stateManager = stateManager
    this.economySystem = economySystem
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

    const state = this.stateManager.getState()
    this.renderer.render(state)

    this.animFrameId = requestAnimationFrame(this.tick)
  }

  private updateTime(deltaMs: number): void {
    const state = this.stateManager.getState()
    const { time } = state

    if (time.speed === TimeSpeed.Paused) return

    const speedMultiplier = TIME_SPEED_MULTIPLIERS[time.speed]
    let remaining = time.tickAccumulator + deltaMs * speedMultiplier

    // 限制单帧最多推进 10 天，避免切标签页回来导致大量计算
    const maxDays = 10
    let daysAdvanced = 0

    while (remaining >= DAY_DURATION_MS && daysAdvanced < maxDays) {
      remaining -= DAY_DURATION_MS
      this.stateManager.advanceDay()
      this.economySystem.processDailyEconomy()
      daysAdvanced++
    }

    if (daysAdvanced >= maxDays) {
      remaining = 0
    }

    this.stateManager.setTickAccumulator(remaining)
  }
}
