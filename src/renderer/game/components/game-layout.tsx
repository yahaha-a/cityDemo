import { useState, useCallback } from 'react'
import { GameCanvas, type GameEngine } from './game-canvas'
import { Toolbar } from './toolbar'
import { InfoPanel } from './info-panel'
import { TimeControl } from './time-control'
import { GameMenu } from './game-menu'
import { MilestonePanel } from './milestone-panel'
import { EventToast } from './event-toast'
import { useGameState } from '../hooks/use-game-state'
import type { ToolType } from 'shared/game-types'

function GameUI({ engine }: { engine: GameEngine }) {
  const state = useGameState(engine.stateManager)

  const handleSelectTool = useCallback(
    (tool: ToolType) => {
      engine.stateManager.setTool(tool)
    },
    [engine.stateManager]
  )

  const handleNewGame = useCallback(() => {
    engine.stateManager.resetGame()
  }, [engine.stateManager])

  return (
    <>
      <Toolbar
        currentTool={state.currentTool}
        demandIndicators={state.economy.demandIndicators}
        money={state.money}
        onSelectTool={handleSelectTool}
      />
      <InfoPanel
        mapSystem={engine.mapSystem}
        roadSystem={engine.roadSystem}
        state={state}
      />
      <MilestonePanel state={state} />
      <EventToast state={state} />
      <TimeControl state={state} stateManager={engine.stateManager} />
      <GameMenu onNewGame={handleNewGame} saveSystem={engine.saveSystem} />
    </>
  )
}

export function GameLayout() {
  const [engine, setEngine] = useState<GameEngine | null>(null)

  const handleEngineReady = useCallback((eng: GameEngine) => {
    setEngine(eng)
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950">
      <GameCanvas onEngineReady={handleEngineReady} />
      {engine && <GameUI engine={engine} />}
    </div>
  )
}
