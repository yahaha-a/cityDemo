import { createContext, useContext, type ReactNode } from 'react'
import type { GameEngineFacade } from './engine-facade'

const GameEngineContext = createContext<GameEngineFacade | null>(null)

export function GameEngineProvider({
  engine,
  children,
}: {
  engine: GameEngineFacade
  children: ReactNode
}) {
  return (
    <GameEngineContext.Provider value={engine}>
      {children}
    </GameEngineContext.Provider>
  )
}

export function useEngine(): GameEngineFacade {
  const engine = useContext(GameEngineContext)
  if (!engine) {
    throw new Error('useEngine must be used within a GameEngineProvider')
  }
  return engine
}
