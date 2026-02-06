import { useRef, useEffect, useState } from 'react'
import { GameStateManager } from '../engine/game-state'
import { GameLoop } from '../engine/game-loop'
import { IsometricRenderer } from '../renderer/isometric-renderer'
import { BuildingSystem } from '../systems/building-system'
import { MapSystem } from '../systems/map-system'
import { RoadSystem } from '../systems/road-system'
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
import { InputHandler } from '../input/input-handler'

/** 注入系统间的运行时依赖 */
function wireSystemDependencies(systems: {
  economySystem: EconomySystem
  eventSystem: EventSystem
  policySystem: PolicySystem
  crisisSystem: CrisisSystem
  specializationSystem: SpecializationSystem
  techSystem: TechSystem
  synergySystem: SynergySystem
}): void {
  const {
    economySystem,
    eventSystem,
    policySystem,
    crisisSystem,
    specializationSystem,
    techSystem,
    synergySystem,
  } = systems
  economySystem.setEventSystem(eventSystem)
  economySystem.setPolicySystem(policySystem)
  economySystem.setCrisisSystem(crisisSystem)
  economySystem.setSpecializationSystem(specializationSystem)
  crisisSystem.setPolicySystem(policySystem)
  techSystem.setPolicySystem(policySystem)
  techSystem.setSynergySystem(synergySystem)
}

export interface GameEngine {
  stateManager: GameStateManager
  buildingSystem: BuildingSystem
  mapSystem: MapSystem
  roadSystem: RoadSystem
  economySystem: EconomySystem
  eventSystem: EventSystem
  milestoneSystem: MilestoneSystem
  saveSystem: SaveSystem
  synergySystem: SynergySystem
  facilitySystem: FacilitySystem
  policySystem: PolicySystem
  crisisSystem: CrisisSystem
  techSystem: TechSystem
  specializationSystem: SpecializationSystem
}

interface GameCanvasProps {
  onEngineReady: (engine: GameEngine) => void
}

export function GameCanvas({ onEngineReady }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<{
    stateManager: GameStateManager
    renderer: IsometricRenderer
    gameLoop: GameLoop
    inputHandler: InputHandler
    buildingSystem: BuildingSystem
    mapSystem: MapSystem
    roadSystem: RoadSystem
    economySystem: EconomySystem
    eventSystem: EventSystem
    milestoneSystem: MilestoneSystem
    saveSystem: SaveSystem
    synergySystem: SynergySystem
    facilitySystem: FacilitySystem
    policySystem: PolicySystem
    crisisSystem: CrisisSystem
    techSystem: TechSystem
    specializationSystem: SpecializationSystem
  } | null>(null)
  const [ready, setReady] = useState(false)

  // 监听父元素尺寸并初始化引擎
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement
    if (!parent) return

    const handleResize = () => {
      const width = parent.clientWidth
      const height = parent.clientHeight

      if (width === 0 || height === 0) return

      // 更新 canvas 尺寸
      canvas.width = width
      canvas.height = height

      // 如果引擎已存在，只更新渲染器
      if (engineRef.current) {
        engineRef.current.renderer.resize(width, height)
        engineRef.current.inputHandler.invalidateRectCache()
        return
      }

      // 首次初始化引擎
      const stateManager = new GameStateManager()
      const renderer = new IsometricRenderer(canvas)

      // 创建所有系统实例
      const roadSystem = new RoadSystem(stateManager)
      const economySystem = new EconomySystem(stateManager)
      const mapSystem = new MapSystem(stateManager)
      const eventSystem = new EventSystem(stateManager)
      const saveSystem = new SaveSystem(stateManager)
      const synergySystem = new SynergySystem(stateManager)
      const facilitySystem = new FacilitySystem(stateManager)
      const policySystem = new PolicySystem(stateManager)
      const crisisSystem = new CrisisSystem(stateManager)
      const techSystem = new TechSystem(stateManager)
      const specializationSystem = new SpecializationSystem(stateManager)

      // 注入系统间依赖
      //
      // 依赖关系图:
      //   Economy ← Event, Policy, Crisis, Specialization
      //   Crisis  ← Policy
      //   Tech    ← Policy, Synergy
      //   Building ← Road, Facility
      //   Milestone ← Event, Map (构造器注入)
      //
      wireSystemDependencies({
        economySystem,
        eventSystem,
        policySystem,
        crisisSystem,
        specializationSystem,
        techSystem,
        synergySystem,
      })

      // 创建有构造器依赖的系统
      const milestoneSystem = new MilestoneSystem(
        stateManager,
        eventSystem,
        mapSystem
      )
      const buildingSystem = new BuildingSystem(stateManager, roadSystem)
      buildingSystem.setFacilitySystem(facilitySystem)

      const gameLoop = new GameLoop(
        renderer,
        stateManager,
        economySystem,
        eventSystem,
        milestoneSystem,
        synergySystem,
        facilitySystem,
        policySystem,
        crisisSystem,
        techSystem
      )

      const inputHandler = new InputHandler(
        canvas,
        stateManager,
        buildingSystem,
        renderer
      )

      engineRef.current = {
        stateManager,
        renderer,
        gameLoop,
        inputHandler,
        buildingSystem,
        mapSystem,
        roadSystem,
        economySystem,
        eventSystem,
        milestoneSystem,
        saveSystem,
        synergySystem,
        facilitySystem,
        policySystem,
        crisisSystem,
        techSystem,
        specializationSystem,
      }

      inputHandler.attach()
      gameLoop.start()
      saveSystem.startAutoSave()
      setReady(true)
    }

    // 初始调用
    handleResize()

    // 监听尺寸变化
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(parent)
    window.addEventListener('resize', handleResize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)

      if (engineRef.current) {
        engineRef.current.gameLoop.stop()
        engineRef.current.inputHandler.detach()
        engineRef.current.saveSystem.stopAutoSave()
        engineRef.current = null
      }
    }
  }, [])

  // 当引擎就绪时通知父组件
  useEffect(() => {
    if (ready && engineRef.current) {
      const {
        stateManager,
        buildingSystem,
        mapSystem,
        roadSystem,
        economySystem,
        eventSystem,
        milestoneSystem,
        saveSystem,
        synergySystem,
        facilitySystem,
        policySystem,
        crisisSystem,
        techSystem,
        specializationSystem,
      } = engineRef.current
      onEngineReady({
        stateManager,
        buildingSystem,
        mapSystem,
        roadSystem,
        economySystem,
        eventSystem,
        milestoneSystem,
        saveSystem,
        synergySystem,
        facilitySystem,
        policySystem,
        crisisSystem,
        techSystem,
        specializationSystem,
      })
    }
  }, [ready, onEngineReady])

  return <canvas className="block w-full h-full" ref={canvasRef} />
}
