import type { ToolType, TimeSpeed, TileType } from 'shared/types'
import { GameStateManager, type StateKey } from './game-state'
import { GameLoop } from './game-loop'
import { SystemRegistry } from './system-registry'
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
import type { GameEngineFacade } from '../context/engine-facade'

/**
 * 游戏引擎 - 负责创建和管理所有游戏系统
 * 实现 GameEngineFacade 接口供 React 组件使用
 */
export class GameEngine implements GameEngineFacade {
  private readonly stateManager: GameStateManager
  private readonly registry: SystemRegistry
  gameLoop: GameLoop | null = null
  private inputHandler: InputHandler | null = null
  private renderer: IsometricRenderer | null = null

  // 内部系统引用（不通过 Facade 暴露）
  private readonly roadSystem: RoadSystem
  private readonly mapSystem: MapSystem
  private readonly economySystem: EconomySystem
  private readonly eventSystem: EventSystem
  private readonly milestoneSystem: MilestoneSystem
  readonly buildingSystem: BuildingSystem
  private readonly saveSystem: SaveSystem
  private readonly synergySystem: SynergySystem
  private readonly facilitySystem: FacilitySystem
  private readonly policySystem: PolicySystem
  private readonly crisisSystem: CrisisSystem
  private readonly techSystem: TechSystem
  private readonly specializationSystem: SpecializationSystem

  constructor() {
    const sm = new GameStateManager()
    this.stateManager = sm
    const registry = new SystemRegistry()
    this.registry = registry

    // 创建所有系统（构造函数仅传 stateManager）
    this.roadSystem = new RoadSystem(sm)
    this.mapSystem = new MapSystem(sm)
    this.eventSystem = new EventSystem(sm)
    this.policySystem = new PolicySystem(sm)
    this.facilitySystem = new FacilitySystem(sm)
    this.synergySystem = new SynergySystem(sm)
    this.specializationSystem = new SpecializationSystem(sm)
    this.saveSystem = new SaveSystem(sm)
    this.crisisSystem = new CrisisSystem(sm)
    this.techSystem = new TechSystem(sm)
    this.economySystem = new EconomySystem(sm)
    this.milestoneSystem = new MilestoneSystem(sm)
    this.buildingSystem = new BuildingSystem(sm)

    // 注册到注册表
    registry.register(this.roadSystem)
    registry.register(this.mapSystem)
    registry.register(this.eventSystem)
    registry.register(this.policySystem)
    registry.register(this.facilitySystem)
    registry.register(this.synergySystem)
    registry.register(this.specializationSystem)
    registry.register(this.saveSystem)
    registry.register(this.crisisSystem)
    registry.register(this.techSystem)
    registry.register(this.economySystem)
    registry.register(this.milestoneSystem)
    registry.register(this.buildingSystem)

    // 定义每日处理顺序
    registry.setTickOrder([
      'event',
      'policy',
      'facility',
      'synergy',
      'tech',
      'crisis',
      'economy',
      'milestone',
    ])

    // 初始化所有系统（解析跨系统依赖）
    registry.initAll()
  }

  // === Facade: 状态订阅 ===
  subscribe = (listener: () => void) => this.stateManager.subscribe(listener)
  subscribeKeys = (keys: StateKey[], listener: () => void) =>
    this.stateManager.subscribeKeys(keys, listener)
  getSnapshot = () => this.stateManager.getSnapshot()

  // === Facade: 工具操作 ===
  setTool(tool: ToolType): void {
    this.stateManager.setTool(tool)
  }
  setTimeSpeed(speed: TimeSpeed): void {
    this.stateManager.setTimeSpeed(speed)
  }
  resetGame(): void {
    this.stateManager.resetGame()
  }

  // === Facade: 政策系统 ===
  togglePolicy(policyId: string): boolean {
    return this.policySystem.togglePolicy(policyId)
  }
  canTogglePolicy(policyId: string): { canToggle: boolean; reason?: string } {
    return this.policySystem.canTogglePolicy(policyId)
  }

  // === Facade: 科技系统 ===
  setResearch(techId: string): boolean {
    return this.techSystem.setResearch(techId)
  }
  cancelResearch(): void {
    this.techSystem.cancelResearch()
  }
  canResearch(techId: string): boolean {
    return this.techSystem.canResearch(techId)
  }
  getResearchProgress(): number {
    return this.techSystem.getResearchProgress()
  }

  // === Facade: 危机系统 ===
  resolveCrisis(optionId: string): boolean {
    return this.crisisSystem.resolveCrisis(optionId)
  }
  hasFacility(facilityType: TileType): boolean {
    return this.crisisSystem.hasFacility(facilityType)
  }

  // === Facade: 特色系统 ===
  chooseSpecialization(specId: string): boolean {
    return this.specializationSystem.chooseSpecialization(specId)
  }

  // === Facade: 存档系统 ===
  getSaveSlots() {
    return this.saveSystem.getSaveSlots()
  }
  createNewSave(name: string): boolean {
    return this.saveSystem.createNewSave(name)
  }
  saveToSlot(slotId: string, name: string): boolean {
    return this.saveSystem.saveToSlot(slotId, name)
  }
  loadFromSlot(slotId: string): boolean {
    return this.saveSystem.loadFromSlot(slotId)
  }
  deleteSlot(slotId: string): boolean {
    return this.saveSystem.deleteSlot(slotId)
  }
  getMaxSlots(): number {
    return this.saveSystem.getMaxSlots()
  }
  startAutoSave(): void {
    this.saveSystem.startAutoSave()
  }
  stopAutoSave(): void {
    this.saveSystem.stopAutoSave()
  }

  // === 引擎生命周期方法（非 Facade 部分） ===

  /** 绑定到 Canvas 并初始化渲染器和输入处理器 */
  attachToCanvas(canvas: HTMLCanvasElement): void {
    this.renderer = new IsometricRenderer(canvas)

    this.gameLoop = new GameLoop(
      this.renderer,
      this.stateManager,
      this.registry
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
    this.registry.disposeAll()
    this.renderer = null
    this.gameLoop = null
    this.inputHandler = null
  }
}
