import { GameStateManager } from './game-state'
import { GameLoop } from './game-loop'
import { IsometricRenderer } from '../renderer/isometric-renderer'
import { RoadSystem } from '../systems/road-system'
import { MapSystem } from '../systems/map-system'
import { EconomySystem } from '../systems/economy-system'
import { EventSystem } from '../systems/event-system'
import { MilestoneSystem } from '../systems/milestone-system'
import { SaveSystem } from '../systems/save-system'
import { SynergySystem } from '../systems/synergy-system'
import { FacilitySystem } from '../systems/facility-system'
import { PolicySystem } from '../systems/policy-system'
import { CrisisSystem } from '../systems/crisis-system'
import { TechSystem } from '../systems/tech-system'
import { SpecializationSystem } from '../systems/specialization-system'
import { BuildingSystem } from '../systems/building-system'
import { InputHandler } from '../input/input-handler'

/**
 * 游戏引擎 - 负责创建和管理所有游戏系统
 *
 * 依赖图（无循环）：
 *   Economy    ← Event, Policy, Crisis, Specialization
 *   Crisis     ← Policy
 *   Tech       ← Policy, Synergy
 *   Building   ← Road, Facility
 *   Milestone  ← Event, Map
 */
export class GameEngine {
  readonly stateManager: GameStateManager
  private gameLoop: GameLoop | null = null
  private inputHandler: InputHandler | null = null
  private renderer: IsometricRenderer | null = null

  // 所有系统作为 readonly 属性直接暴露
  readonly roadSystem: RoadSystem
  readonly mapSystem: MapSystem
  readonly economySystem: EconomySystem
  readonly eventSystem: EventSystem
  readonly milestoneSystem: MilestoneSystem
  readonly buildingSystem: BuildingSystem
  readonly saveSystem: SaveSystem
  readonly synergySystem: SynergySystem
  readonly facilitySystem: FacilitySystem
  readonly policySystem: PolicySystem
  readonly crisisSystem: CrisisSystem
  readonly techSystem: TechSystem
  readonly specializationSystem: SpecializationSystem

  constructor() {
    const sm = new GameStateManager()
    this.stateManager = sm

    // 独立系统（无系统间依赖）
    this.roadSystem = new RoadSystem(sm)
    this.mapSystem = new MapSystem(sm)
    this.eventSystem = new EventSystem(sm)
    this.policySystem = new PolicySystem(sm)
    this.facilitySystem = new FacilitySystem(sm)
    this.synergySystem = new SynergySystem(sm)
    this.specializationSystem = new SpecializationSystem(sm)
    this.saveSystem = new SaveSystem(sm)

    // 有依赖的系统
    this.crisisSystem = new CrisisSystem(sm, this.policySystem)
    this.techSystem = new TechSystem(sm, this.policySystem, this.synergySystem)
    this.economySystem = new EconomySystem(
      sm,
      this.eventSystem,
      this.policySystem,
      this.crisisSystem,
      this.specializationSystem
    )
    this.milestoneSystem = new MilestoneSystem(
      sm,
      this.eventSystem,
      this.mapSystem
    )
    this.buildingSystem = new BuildingSystem(
      sm,
      this.roadSystem,
      this.facilitySystem
    )
  }

  /** 绑定到 Canvas 并初始化渲染器和输入处理器 */
  attachToCanvas(canvas: HTMLCanvasElement): void {
    this.renderer = new IsometricRenderer(canvas)

    this.gameLoop = new GameLoop(
      this.renderer,
      this.stateManager,
      this.economySystem,
      this.eventSystem,
      this.milestoneSystem,
      this.synergySystem,
      this.facilitySystem,
      this.policySystem,
      this.crisisSystem,
      this.techSystem
    )

    this.inputHandler = new InputHandler(
      canvas,
      this.stateManager,
      this.buildingSystem,
      this.renderer
    )
  }

  /** 启动游戏循环 */
  start(): void {
    this.inputHandler?.attach()
    this.gameLoop?.start()
    this.saveSystem.startAutoSave()
  }

  /** 停止游戏循环 */
  stop(): void {
    this.gameLoop?.stop()
    this.inputHandler?.detach()
    this.saveSystem.stopAutoSave()
  }

  /** 调整渲染器和输入处理器尺寸 */
  resize(width: number, height: number): void {
    this.renderer?.resize(width, height)
    this.inputHandler?.invalidateRectCache()
  }

  /** 释放所有资源 */
  dispose(): void {
    this.stop()
    this.renderer = null
    this.gameLoop = null
    this.inputHandler = null
  }
}
