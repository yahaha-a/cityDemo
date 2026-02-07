import { useState, useCallback, useEffect } from 'react'
import { GameCanvas } from './game-canvas'
import type { GameEngine } from '../engine/game-engine'
import type { GameEngineFacade } from '../context/engine-facade'
import { GameEngineProvider, useEngine } from '../context/game-engine-context'
import { GameErrorBoundary } from './game-error-boundary'
import { HudBar } from './hud-bar'
import { DockToolbar, type ModalType } from './dock-toolbar'
import { InfoPanel } from './info-panel'
import { StatusPanel } from './status-panel'
import { TileTooltip } from './tile-tooltip'
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

function GameUI({ onReturnToStart }: { onReturnToStart?: () => void }) {
  const engine = useEngine()
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const tech = useTechState()
  const challenge = useChallenge()
  const specialization = useSpecialization()

  const handleSelectTool = useCallback(
    (tool: import('shared/types').ToolType) => {
      engine.setTool(tool)
    },
    [engine]
  )

  const handleResetGame = useCallback(() => {
    engine.resetGame()
  }, [engine])

  const handleToggleModal = useCallback((modal: ModalType) => {
    setActiveModal(modal)
  }, [])

  // Escape 键关闭面板
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (menuOpen) {
          setMenuOpen(false)
        } else if (activeModal) {
          setActiveModal(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeModal, menuOpen])

  return (
    <>
      {/* HUD 顶栏 */}
      <HudBar onOpenMenu={() => setMenuOpen(true)} />

      {/* 底部 Dock 工具栏 */}
      <DockToolbar
        activeModal={activeModal}
        onSelectTool={handleSelectTool}
        onToggleModal={handleToggleModal}
      />

      {/* 左侧边栏 - 状态面板 */}
      <div className="absolute top-10 left-0 bottom-16 w-[200px] z-25 pointer-events-auto">
        <StatusPanel />
      </div>

      {/* 右侧边栏 - 信息面板 */}
      <div className="absolute top-10 right-0 bottom-16 w-[240px] z-25 pointer-events-auto">
        <InfoPanel />
      </div>

      {/* 弹窗面板 */}
      {activeModal && (
        <ModalOverlay onClick={() => setActiveModal(null)}>
          <div onClick={e => e.stopPropagation()} onKeyDown={() => {}}>
            {activeModal === 'milestones' && <MilestonePanel />}
            {activeModal === 'policy' && <PolicyPanel />}
            {activeModal === 'tech' && <TechPanel dailyRP={tech.dailyRP} />}
          </div>
        </ModalOverlay>
      )}

      {/* 浮动 Tooltip */}
      <TileTooltip />

      {/* 事件通知 - HudBar 下方 */}
      <EventToast />

      {/* 挑战模式信息 */}
      {challenge.challengeMode && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-[var(--game-radius-md)] text-xs game-parchment-bg border border-[var(--game-wood)] text-[var(--game-text)] z-10">
          {challenge.gameOver
            ? `败北 - 分数: ${challenge.score}`
            : challenge.gameWon
              ? `胜利! 分数: ${challenge.score}`
              : `挑战中 ${challenge.winProgress > 0 ? `(${challenge.winProgress}/30)` : ''}`}
        </div>
      )}

      {/* 游戏菜单 */}
      <GameMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onResetGame={handleResetGame}
        onReturnToStart={onReturnToStart}
      />

      {/* 危机弹窗 */}
      <CrisisDialog />

      {/* 特色选择（首次解锁时显示） */}
      {specialization.available.length > 0 && !specialization.chosen && (
        <SpecializationPanel />
      )}

      {/* 挑战模式游戏结束覆盖 */}
      {challenge.challengeMode && (challenge.gameOver || challenge.gameWon) && (
        <ModalOverlay className="z-50">
          <div className="game-parchment-bg game-wood-frame rounded-[var(--game-radius-lg)] p-6 text-center">
            <h2
              className={`text-2xl font-bold font-[family-name:var(--font-heading)] mb-2 ${challenge.gameWon ? 'text-[var(--game-green)]' : 'text-[var(--game-red)]'}`}
            >
              {challenge.gameWon ? '胜利!' : '败北'}
            </h2>
            <div className="text-lg text-[var(--game-text)] mb-4">
              最终得分: {challenge.score}
            </div>
            <GameButton
              intent="primary"
              onClick={handleResetGame}
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

interface GameLayoutProps {
  loadSlotId?: string
  onReturnToStart?: () => void
}

export function GameLayout({ loadSlotId, onReturnToStart }: GameLayoutProps) {
  const [engine, setEngine] = useState<GameEngineFacade | null>(null)

  const handleEngineReady = useCallback(
    (eng: GameEngine) => {
      if (loadSlotId) {
        eng.loadFromSlot(loadSlotId)
      }
      setEngine(eng)
    },
    [loadSlotId]
  )

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[var(--game-parchment-dark)]">
      {/* 隐藏 SVG 滤镜定义 */}
      <svg aria-hidden="true" className="absolute w-0 h-0">
        <defs>
          <filter id="hand-drawn">
            <feTurbulence
              baseFrequency="0.02"
              numOctaves="3"
              result="noise"
              type="fractalNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="1"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <GameCanvas onEngineReady={handleEngineReady} />
      {engine && (
        <GameEngineProvider engine={engine}>
          <GameErrorBoundary>
            <GameUI onReturnToStart={onReturnToStart} />
          </GameErrorBoundary>
        </GameEngineProvider>
      )}
    </div>
  )
}
