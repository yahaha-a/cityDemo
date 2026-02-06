import { createContext, useContext, type ReactNode } from 'react'
import type { GameEngine } from '../engine/game-engine'

const GameEngineContext = createContext<GameEngine | null>(null)

export function GameEngineProvider({
  engine,
  children,
}: {
  engine: GameEngine
  children: ReactNode
}) {
  return (
    <GameEngineContext.Provider value={engine}>
      {children}
    </GameEngineContext.Provider>
  )
}

export function useEngine(): GameEngine {
  const engine = useContext(GameEngineContext)
  if (!engine) {
    throw new Error('useEngine must be used within a GameEngineProvider')
  }
  return engine
}
