import type { GameStateManager } from './game-state'
import type { IsometricRenderer } from '../renderer/isometric-renderer'

/**
 * 游戏主循环 - requestAnimationFrame
 */
export class GameLoop {
  private renderer: IsometricRenderer
  private stateManager: GameStateManager
  private animFrameId = 0
  private running = false

  constructor(renderer: IsometricRenderer, stateManager: GameStateManager) {
    this.renderer = renderer
    this.stateManager = stateManager
  }

  start(): void {
    if (this.running) return
    this.running = true
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

    const state = this.stateManager.getState()
    this.renderer.render(state)

    this.animFrameId = requestAnimationFrame(this.tick)
  }
}
