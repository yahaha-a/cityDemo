import { TimeSpeed } from 'shared/game-types'
import type { GameStateManager } from './game-state'
import type { IsometricRenderer } from '../renderer/isometric-renderer'
import type { EconomySystem } from '../systems/economy-system'
import type { EventSystem } from '../systems/event-system'
import type { MilestoneSystem } from '../systems/milestone-system'
import type { SynergySystem } from '../systems/synergy-system'
import type { FacilitySystem } from '../systems/facility-system'
import type { PolicySystem } from '../systems/policy-system'
import type { CrisisSystem } from '../systems/crisis-system'
import type { TechSystem } from '../systems/tech-system'
import { DAY_DURATION_MS, TIME_SPEED_MULTIPLIERS } from '../constants'

/**
 * 游戏主循环 - requestAnimationFrame
 *
 * 每日处理顺序：
 * Events → Policies → Facilities → Synergy → Tech → Crisis → Economy → Milestones
 */
export class GameLoop {
  private renderer: IsometricRenderer
  private stateManager: GameStateManager
  private economySystem: EconomySystem
  private eventSystem: EventSystem
  private milestoneSystem: MilestoneSystem
  private synergySystem: SynergySystem
  private facilitySystem: FacilitySystem
  private policySystem: PolicySystem
  private crisisSystem: CrisisSystem
  private techSystem: TechSystem
  private animFrameId = 0
  private running = false
  private lastTimestamp = 0

  constructor(
    renderer: IsometricRenderer,
    stateManager: GameStateManager,
    economySystem: EconomySystem,
    eventSystem: EventSystem,
    milestoneSystem: MilestoneSystem,
    synergySystem: SynergySystem,
    facilitySystem: FacilitySystem,
    policySystem: PolicySystem,
    crisisSystem: CrisisSystem,
    techSystem: TechSystem
  ) {
    this.renderer = renderer
    this.stateManager = stateManager
    this.economySystem = economySystem
    this.eventSystem = eventSystem
    this.milestoneSystem = milestoneSystem
    this.synergySystem = synergySystem
    this.facilitySystem = facilitySystem
    this.policySystem = policySystem
    this.crisisSystem = crisisSystem
    this.techSystem = techSystem
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

    // 如果有待处理的危机，暂停时间推进
    if (state.challenge.pendingCrisis) return

    const speedMultiplier = TIME_SPEED_MULTIPLIERS[time.speed]
    let remaining = time.tickAccumulator + deltaMs * speedMultiplier

    // 限制单帧最多推进 10 天，避免切标签页回来导致大量计算
    const maxDays = 10
    let daysAdvanced = 0

    while (remaining >= DAY_DURATION_MS && daysAdvanced < maxDays) {
      remaining -= DAY_DURATION_MS
      this.stateManager.advanceDay()

      // 每日顺序: 事件 → 政策 → 设施 → 协同 → 科技 → 危机 → 经济 → 里程碑
      this.eventSystem.processDailyEvents()
      this.policySystem.processDailyPolicies()
      this.facilitySystem.processDailyFacilities()
      this.synergySystem.processDailySynergy()
      this.techSystem.processDailyTech()
      this.crisisSystem.processDailyCrisis()
      this.economySystem.processDailyEconomy()
      this.milestoneSystem.processDailyMilestones()
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
