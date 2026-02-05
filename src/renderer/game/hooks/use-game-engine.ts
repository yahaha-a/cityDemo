import { useRef, useEffect } from 'react'
import { GameStateManager } from '../engine/game-state'
import { GameLoop } from '../engine/game-loop'
import { IsometricRenderer } from '../renderer/isometric-renderer'
import { BuildingSystem } from '../systems/building-system'
import { MapSystem } from '../systems/map-system'
import { RoadSystem } from '../systems/road-system'
import { EconomySystem } from '../systems/economy-system'
import { InputHandler } from '../input/input-handler'

export interface GameEngine {
  stateManager: GameStateManager
  buildingSystem: BuildingSystem
  mapSystem: MapSystem
  roadSystem: RoadSystem
  economySystem: EconomySystem
}

/**
 * 游戏引擎初始化 Hook
 * 负责初始化所有游戏系统并绑定到 Canvas
 */
export function useGameEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>
): GameEngine {
  const engineRef = useRef<{
    stateManager: GameStateManager
    gameLoop: GameLoop
    renderer: IsometricRenderer
    buildingSystem: BuildingSystem
    mapSystem: MapSystem
    roadSystem: RoadSystem
    economySystem: EconomySystem
    inputHandler: InputHandler
  } | null>(null)

  const stateManagerRef = useRef<GameStateManager>(new GameStateManager())
  const roadSystemRef = useRef<RoadSystem>(
    new RoadSystem(stateManagerRef.current)
  )
  const economySystemRef = useRef<EconomySystem>(
    new EconomySystem(stateManagerRef.current)
  )
  const buildingSystemRef = useRef<BuildingSystem>(
    new BuildingSystem(stateManagerRef.current, roadSystemRef.current)
  )
  const mapSystemRef = useRef<MapSystem>(new MapSystem(stateManagerRef.current))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const stateManager = stateManagerRef.current
    const economySystem = economySystemRef.current
    const renderer = new IsometricRenderer(canvas)
    const gameLoop = new GameLoop(renderer, stateManager, economySystem)
    const buildingSystem = buildingSystemRef.current
    const mapSystem = mapSystemRef.current
    const roadSystem = roadSystemRef.current
    const inputHandler = new InputHandler(
      canvas,
      stateManager,
      buildingSystem,
      renderer
    )

    engineRef.current = {
      stateManager,
      gameLoop,
      renderer,
      buildingSystem,
      mapSystem,
      roadSystem,
      economySystem,
      inputHandler,
    }

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
      engineRef.current = null
    }
  }, [canvasRef])

  return {
    stateManager: stateManagerRef.current,
    buildingSystem: buildingSystemRef.current,
    mapSystem: mapSystemRef.current,
    roadSystem: roadSystemRef.current,
    economySystem: economySystemRef.current,
  }
}
