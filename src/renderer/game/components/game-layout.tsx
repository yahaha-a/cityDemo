import { useState, useCallback } from 'react'
import { GameCanvas } from './game-canvas'
import type { GameEngine } from '../engine/game-engine'
import { GameEngineProvider, useEngine } from '../context/game-engine-context'
import { GameErrorBoundary } from './game-error-boundary'
import { Toolbar } from './toolbar'
import { InfoPanel } from './info-panel'
import { TimeControl } from './time-control'
import { GameMenu } from './game-menu'
import { MilestonePanel } from './milestone-panel'
import { EventToast } from './event-toast'
import { PolicyPanel } from './policy-panel'
import { TechPanel } from './tech-panel'
import { CrisisDialog } from './crisis-dialog'
import { SpecializationPanel } from './specialization-panel'
import {
  useTechState,
  useChallenge,
  useSpecialization,
} from '../hooks/use-game-selector'
import { GameButton } from './ui/game-button'
import { ModalOverlay } from './ui/modal-overlay'

function GameUI() {
  const engine = useEngine()
  const [showPolicy, setShowPolicy] = useState(false)
  const [showTech, setShowTech] = useState(false)

  const tech = useTechState()
  const challenge = useChallenge()
  const specialization = useSpecialization()

  const handleSelectTool = useCallback(
    (tool: import('shared/game-types').ToolType) => {
      engine.stateManager.setTool(tool)
    },
    [engine.stateManager]
  )

  const handleNewGame = useCallback(() => {
    engine.stateManager.resetGame()
  }, [engine.stateManager])

  return (
    <>
      <Toolbar onSelectTool={handleSelectTool} />
      <InfoPanel />
      <MilestonePanel />
      <EventToast />
      <TimeControl />
      <GameMenu onNewGame={handleNewGame} />

      {/* 底部面板切换按钮 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        <GameButton
          className={showPolicy ? '' : 'border border-gray-700'}
          intent={showPolicy ? 'active' : 'default'}
          onClick={() => {
            setShowPolicy(!showPolicy)
            setShowTech(false)
          }}
          variant="toggle"
        >
          政策
        </GameButton>
        <GameButton
          className={showTech ? '' : 'border border-gray-700'}
          intent={showTech ? 'purple' : 'default'}
          onClick={() => {
            setShowTech(!showTech)
            setShowPolicy(false)
          }}
          variant="toggle"
        >
          科技 {tech.dailyRP > 0 ? `(${tech.dailyRP} RP/日)` : ''}
        </GameButton>
        {challenge.challengeMode && (
          <div className="px-3 py-1.5 rounded text-xs bg-gray-800/90 border border-gray-700 text-gray-300">
            {challenge.gameOver
              ? `败北 - 分数: ${challenge.score}`
              : challenge.gameWon
                ? `胜利! 分数: ${challenge.score}`
                : `挑战中 ${challenge.winProgress > 0 ? `(${challenge.winProgress}/30)` : ''}`}
          </div>
        )}
      </div>

      {/* 条件面板 */}
      {showPolicy && <PolicyPanel />}
      {showTech && <TechPanel />}

      {/* 危机弹窗 */}
      <CrisisDialog />

      {/* 特色选择（首次解锁时显示） */}
      {specialization.available.length > 0 && !specialization.chosen && (
        <SpecializationPanel />
      )}

      {/* 挑战模式游戏结束覆盖 */}
      {challenge.challengeMode && (challenge.gameOver || challenge.gameWon) && (
        <ModalOverlay className="bg-black/70">
          <div className="bg-gray-900 rounded-lg border border-gray-600 p-6 text-center">
            <h2
              className={`text-2xl font-bold mb-2 ${challenge.gameWon ? 'text-green-400' : 'text-red-400'}`}
            >
              {challenge.gameWon ? '胜利!' : '败北'}
            </h2>
            <div className="text-lg text-white mb-4">
              最终得分: {challenge.score}
            </div>
            <GameButton
              intent="primary"
              onClick={handleNewGame}
              variant="action"
            >
              重新开始
            </GameButton>
          </div>
        </ModalOverlay>
      )}
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
      {engine && (
        <GameEngineProvider engine={engine}>
          <GameErrorBoundary>
            <GameUI />
          </GameErrorBoundary>
        </GameEngineProvider>
      )}
    </div>
  )
}
