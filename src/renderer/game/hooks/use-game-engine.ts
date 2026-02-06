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
import { InputHandler } from '../input/input-handler'

export interface GameEngine {
  stateManager: GameStateManager
  buildingSystem: BuildingSystem
  mapSystem: MapSystem
  roadSystem: RoadSystem
  economySystem: EconomySystem
  eventSystem: EventSystem
  milestoneSystem: MilestoneSystem
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

  // 注入事件系统
  economySystemRef.current.setEventSystem(eventSystemRef.current)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const stateManager = stateManagerRef.current
    const economySystem = economySystemRef.current
    const eventSystem = eventSystemRef.current
    const milestoneSystem = milestoneSystemRef.current
    const renderer = new IsometricRenderer(canvas)
    const gameLoop = new GameLoop(
      renderer,
      stateManager,
      economySystem,
      eventSystem,
      milestoneSystem
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
  }
}
