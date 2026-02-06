import { useState, useCallback } from 'react'
import { GameCanvas, type GameEngine } from './game-canvas'
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
import { useGameState } from '../hooks/use-game-state'
import type { ToolType } from 'shared/game-types'

function GameUI({ engine }: { engine: GameEngine }) {
  const state = useGameState(engine.stateManager)
  const [showPolicy, setShowPolicy] = useState(false)
  const [showTech, setShowTech] = useState(false)

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
        state={state}
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

      {/* 底部面板切换按钮 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        <button
          className={`px-3 py-1.5 rounded text-xs transition-colors ${
            showPolicy
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800/90 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
          onClick={() => {
            setShowPolicy(!showPolicy)
            setShowTech(false)
          }}
          type="button"
        >
          政策
        </button>
        <button
          className={`px-3 py-1.5 rounded text-xs transition-colors ${
            showTech
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800/90 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
          onClick={() => {
            setShowTech(!showTech)
            setShowPolicy(false)
          }}
          type="button"
        >
          科技 {state.tech.dailyRP > 0 ? `(${state.tech.dailyRP} RP/日)` : ''}
        </button>
        {state.challenge.challengeMode && (
          <div className="px-3 py-1.5 rounded text-xs bg-gray-800/90 border border-gray-700 text-gray-300">
            {state.challenge.gameOver
              ? `败北 - 分数: ${state.challenge.score}`
              : state.challenge.gameWon
                ? `胜利! 分数: ${state.challenge.score}`
                : `挑战中 ${state.challenge.winProgress > 0 ? `(${state.challenge.winProgress}/30)` : ''}`}
          </div>
        )}
      </div>

      {/* 条件面板 */}
      {showPolicy && (
        <PolicyPanel policySystem={engine.policySystem} state={state} />
      )}
      {showTech && <TechPanel state={state} techSystem={engine.techSystem} />}

      {/* 危机弹窗 */}
      <CrisisDialog crisisSystem={engine.crisisSystem} state={state} />

      {/* 特色选择（首次解锁时显示） */}
      {state.specialization.available.length > 0 &&
        !state.specialization.chosen && (
          <SpecializationPanel
            specializationSystem={engine.specializationSystem}
            state={state}
          />
        )}

      {/* 挑战模式游戏结束覆盖 */}
      {state.challenge.challengeMode &&
        (state.challenge.gameOver || state.challenge.gameWon) && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
            <div className="bg-gray-900 rounded-lg border border-gray-600 p-6 text-center">
              <h2
                className={`text-2xl font-bold mb-2 ${state.challenge.gameWon ? 'text-green-400' : 'text-red-400'}`}
              >
                {state.challenge.gameWon ? '胜利!' : '败北'}
              </h2>
              <div className="text-lg text-white mb-4">
                最终得分: {state.challenge.score}
              </div>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 text-sm"
                onClick={handleNewGame}
                type="button"
              >
                重新开始
              </button>
            </div>
          </div>
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
      {engine && <GameUI engine={engine} />}
    </div>
  )
}
