import { useRef, useEffect } from 'react'
import { GameStateManager } from '../engine/game-state'
import { GameLoop } from '../engine/game-loop'
import { IsometricRenderer } from '../renderer/isometric-renderer'
import { BuildingSystem } from '../systems/building-system'
import { MapSystem } from '../systems/map-system'
import { RoadSystem } from '../systems/road-system'
import { EconomySystem } from '../systems/economy-system'
import { EventSystem } from '../systems/event-system'
import { MilestoneSystem } from '../systems/milestone-system'
import { SynergySystem } from '../systems/synergy-system'
import { FacilitySystem } from '../systems/facility-system'
import { PolicySystem } from '../systems/policy-system'
import { CrisisSystem } from '../systems/crisis-system'
import { TechSystem } from '../systems/tech-system'
import { SpecializationSystem } from '../systems/specialization-system'
import { InputHandler } from '../input/input-handler'

export interface GameEngine {
  stateManager: GameStateManager
  buildingSystem: BuildingSystem
  mapSystem: MapSystem
  roadSystem: RoadSystem
  economySystem: EconomySystem
  eventSystem: EventSystem
  milestoneSystem: MilestoneSystem
  synergySystem: SynergySystem
  facilitySystem: FacilitySystem
  policySystem: PolicySystem
  crisisSystem: CrisisSystem
  techSystem: TechSystem
  specializationSystem: SpecializationSystem
}

/**
 * 游戏引擎初始化 Hook
 * 负责初始化所有游戏系统并绑定到 Canvas
 */
export function useGameEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>
): GameEngine {
  const stateManagerRef = useRef<GameStateManager>(new GameStateManager())
  const roadSystemRef = useRef<RoadSystem>(
    new RoadSystem(stateManagerRef.current)
  )
  const economySystemRef = useRef<EconomySystem>(
    new EconomySystem(stateManagerRef.current)
  )
  const eventSystemRef = useRef<EventSystem>(
    new EventSystem(stateManagerRef.current)
  )
  const mapSystemRef = useRef<MapSystem>(new MapSystem(stateManagerRef.current))
  const synergySystemRef = useRef<SynergySystem>(
    new SynergySystem(stateManagerRef.current)
  )
  const facilitySystemRef = useRef<FacilitySystem>(
    new FacilitySystem(stateManagerRef.current)
  )
  const policySystemRef = useRef<PolicySystem>(
    new PolicySystem(stateManagerRef.current)
  )
  const crisisSystemRef = useRef<CrisisSystem>(
    new CrisisSystem(stateManagerRef.current)
  )
  const techSystemRef = useRef<TechSystem>(
    new TechSystem(stateManagerRef.current)
  )
  const specializationSystemRef = useRef<SpecializationSystem>(
    new SpecializationSystem(stateManagerRef.current)
  )
  const milestoneSystemRef = useRef<MilestoneSystem>(
    new MilestoneSystem(
      stateManagerRef.current,
      eventSystemRef.current,
      mapSystemRef.current
    )
  )
  const buildingSystemRef = useRef<BuildingSystem>(
    new BuildingSystem(stateManagerRef.current, roadSystemRef.current)
  )

  // 注入系统间依赖
  // 依赖图: Economy←Event/Policy/Crisis/Specialization,
  //         Crisis←Policy, Tech←Policy/Synergy, Building←Facility
  economySystemRef.current.setEventSystem(eventSystemRef.current)
  economySystemRef.current.setPolicySystem(policySystemRef.current)
  economySystemRef.current.setCrisisSystem(crisisSystemRef.current)
  economySystemRef.current.setSpecializationSystem(
    specializationSystemRef.current
  )
  crisisSystemRef.current.setPolicySystem(policySystemRef.current)
  techSystemRef.current.setPolicySystem(policySystemRef.current)
  techSystemRef.current.setSynergySystem(synergySystemRef.current)
  buildingSystemRef.current.setFacilitySystem(facilitySystemRef.current)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const stateManager = stateManagerRef.current
    const economySystem = economySystemRef.current
    const eventSystem = eventSystemRef.current
    const milestoneSystem = milestoneSystemRef.current
    const synergySystem = synergySystemRef.current
    const facilitySystem = facilitySystemRef.current
    const policySystem = policySystemRef.current
    const crisisSystem = crisisSystemRef.current
    const techSystem = techSystemRef.current
    const renderer = new IsometricRenderer(canvas)
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
    const buildingSystem = buildingSystemRef.current
    const inputHandler = new InputHandler(
      canvas,
      stateManager,
      buildingSystem,
      renderer
    )

    // 处理窗口大小调整
    const handleResize = (): void => {
      const parent = canvas.parentElement
      if (!parent) return
      renderer.resize(parent.clientWidth, parent.clientHeight)
      inputHandler.invalidateRectCache()
    }

    handleResize()
    inputHandler.attach()
    gameLoop.start()

    window.addEventListener('resize', handleResize)

    return () => {
      gameLoop.stop()
      inputHandler.detach()
      window.removeEventListener('resize', handleResize)
    }
  }, [canvasRef])

  return {
    stateManager: stateManagerRef.current,
    buildingSystem: buildingSystemRef.current,
    mapSystem: mapSystemRef.current,
    roadSystem: roadSystemRef.current,
    economySystem: economySystemRef.current,
    eventSystem: eventSystemRef.current,
    milestoneSystem: milestoneSystemRef.current,
    synergySystem: synergySystemRef.current,
    facilitySystem: facilitySystemRef.current,
    policySystem: policySystemRef.current,
    crisisSystem: crisisSystemRef.current,
    techSystem: techSystemRef.current,
    specializationSystem: specializationSystemRef.current,
  }
}
