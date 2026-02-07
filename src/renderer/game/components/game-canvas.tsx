import { useEffect, useRef } from 'react'
import { GameEngine } from '../engine/game-engine'
import { useGameStore } from '../stores/game-store'
import { CityScene } from '../scene'

interface GameCanvasProps {
  onEngineReady: (engine: GameEngine) => void
}

export function GameCanvas({ onEngineReady }: GameCanvasProps) {
  const engineRef = useRef<GameEngine | null>(null)

  useEffect(() => {
    const engine = new GameEngine()
    engine.start()
    engineRef.current = engine

    // 桥接到 zustand store
    const unsub = useGameStore.getState().setEngine(engine)

    onEngineReady(engine)

    return () => {
      unsub()
      engine.dispose()
      engineRef.current = null
    }
  }, [onEngineReady])

  return <CityScene />
}
