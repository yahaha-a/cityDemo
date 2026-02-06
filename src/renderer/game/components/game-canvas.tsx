import { useRef, useEffect, useState } from 'react'
import { GameEngine } from '../engine/game-engine'

interface GameCanvasProps {
  onEngineReady: (engine: GameEngine) => void
}

export function GameCanvas({ onEngineReady }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement
    if (!parent) return

    const handleResize = () => {
      const width = parent.clientWidth
      const height = parent.clientHeight
      if (width === 0 || height === 0) return

      canvas.width = width
      canvas.height = height

      if (engineRef.current) {
        engineRef.current.resize(width, height)
        return
      }

      const engine = new GameEngine()
      engine.attachToCanvas(canvas)
      engine.start()
      engineRef.current = engine
      setReady(true)
    }

    handleResize()

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(parent)
    window.addEventListener('resize', handleResize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)

      if (engineRef.current) {
        engineRef.current.dispose()
        engineRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (ready && engineRef.current) {
      onEngineReady(engineRef.current)
    }
  }, [ready, onEngineReady])

  return <canvas className="block w-full h-full" ref={canvasRef} />
}
