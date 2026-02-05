import { useRef, useEffect, useState } from 'react'
import { GameStateManager } from '../engine/game-state'
import { GameLoop } from '../engine/game-loop'
import { IsometricRenderer } from '../renderer/isometric-renderer'
import { BuildingSystem } from '../systems/building-system'
import { MapSystem } from '../systems/map-system'
import { InputHandler } from '../input/input-handler'

export interface GameEngine {
  stateManager: GameStateManager
  buildingSystem: BuildingSystem
  mapSystem: MapSystem
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
        return
      }

      // 首次初始化引擎
      const stateManager = new GameStateManager()
      const renderer = new IsometricRenderer(canvas)
      const gameLoop = new GameLoop(renderer, stateManager)
      const buildingSystem = new BuildingSystem(stateManager)
      const mapSystem = new MapSystem(stateManager)
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
      }

      inputHandler.attach()
      gameLoop.start()
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
        engineRef.current = null
      }
    }
  }, [])

  // 当引擎就绪时通知父组件
  useEffect(() => {
    if (ready && engineRef.current) {
      const { stateManager, buildingSystem, mapSystem } = engineRef.current
      onEngineReady({ stateManager, buildingSystem, mapSystem })
    }
  }, [ready, onEngineReady])

  return <canvas className="block w-full h-full" ref={canvasRef} />
}
