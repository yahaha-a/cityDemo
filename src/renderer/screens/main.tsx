import { useState, useCallback } from 'react'
import { GameLayout } from 'renderer/game/components/game-layout'
import { StartScreen } from 'renderer/game/components/start-screen'

type ScreenState = { screen: 'start' } | { screen: 'game'; loadSlotId?: string }

export function MainScreen() {
  const [state, setState] = useState<ScreenState>({ screen: 'start' })

  const handleNewGame = useCallback(() => {
    setState({ screen: 'game' })
  }, [])

  const handleLoadGame = useCallback((slotId: string) => {
    setState({ screen: 'game', loadSlotId: slotId })
  }, [])

  const handleReturnToStart = useCallback(() => {
    setState({ screen: 'start' })
  }, [])

  const handleQuit = useCallback(() => {
    window.App.quit()
  }, [])

  if (state.screen === 'start') {
    return (
      <StartScreen
        onLoadGame={handleLoadGame}
        onNewGame={handleNewGame}
        onQuit={handleQuit}
      />
    )
  }

  return (
    <GameLayout
      loadSlotId={state.loadSlotId}
      onReturnToStart={handleReturnToStart}
    />
  )
}
