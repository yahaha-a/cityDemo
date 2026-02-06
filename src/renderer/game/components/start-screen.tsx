import { useState, useEffect, useCallback } from 'react'
import { GameButton } from './ui/game-button'
import type { SaveSlot } from '../systems/save-system'

const STORAGE_KEY = 'city-demo-saves'

interface StartScreenProps {
  onNewGame: () => void
  onLoadGame: (slotId: string) => void
  onQuit: () => void
}

function getSaveSlots(): SaveSlot[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const saves = JSON.parse(data) as Record<
      string,
      {
        name: string
        timestamp: number
        gameState: { time: { day: number }; money: number }
      }
    >
    return Object.entries(saves)
      .map(([id, save]) => ({
        id,
        name: save.name,
        timestamp: save.timestamp,
        day: save.gameState.time.day,
        money: save.gameState.money,
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
  } catch {
    return []
  }
}

type View = 'main' | 'load'

export function StartScreen({
  onNewGame,
  onLoadGame,
  onQuit,
}: StartScreenProps) {
  const [view, setView] = useState<View>('main')
  const [slots, setSlots] = useState<SaveSlot[]>([])
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    setSlots(getSaveSlots())
  }, [])

  const hasSaves = slots.length > 0
  const latestSave = hasSaves ? slots[0] : null

  const handleTransition = useCallback((action: () => void) => {
    setExiting(true)
    setTimeout(action, 400)
  }, [])

  const handleContinue = useCallback(() => {
    if (latestSave) {
      handleTransition(() => onLoadGame(latestSave.id))
    }
  }, [latestSave, onLoadGame, handleTransition])

  const handleNewGame = useCallback(() => {
    handleTransition(onNewGame)
  }, [onNewGame, handleTransition])

  const handleLoadSlot = useCallback(
    (slotId: string) => {
      handleTransition(() => onLoadGame(slotId))
    },
    [onLoadGame, handleTransition]
  )

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center ${exiting ? 'animate-[screenFadeOut_0.4s_ease-in_forwards]' : ''}`}
      style={{
        backgroundColor: 'var(--game-parchment-dark)',
        backgroundImage: `
          radial-gradient(ellipse at 30% 20%, oklch(0.90 0.04 75 / 0.5) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, oklch(0.88 0.03 85 / 0.4) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, oklch(0.92 0.03 80 / 0.6) 0%, transparent 70%)
        `,
      }}
    >
      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--game-wood)] to-transparent opacity-60" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--game-wood)] to-transparent opacity-60" />

      {/* 城市剪影装饰 */}
      <CitySkyline />

      {/* 主内容区域 */}
      <div className="relative z-10 flex flex-col items-center">
        {/* 装饰印章 */}
        <div
          className="mb-6 animate-[stampIn_0.8s_ease-out]"
          style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center border-[3px] border-[var(--game-gold)] shadow-[0_0_20px_oklch(0.72_0.14_75/0.3)]"
            style={{
              background:
                'radial-gradient(circle, var(--game-gold-light), var(--game-gold))',
            }}
          >
            <span className="text-3xl font-bold text-[var(--game-text-heading)] font-[family-name:var(--font-heading)]">
              城
            </span>
          </div>
        </div>

        {/* 游戏标题 */}
        <h1
          className="text-5xl font-bold font-[family-name:var(--font-heading)] text-[var(--game-text-heading)] mb-2 animate-[titleReveal_1s_ease-out]"
          style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}
        >
          城市建造者
        </h1>

        {/* 副标题 */}
        <p
          className="text-sm text-[var(--game-text-muted)] mb-10 animate-[subtitleReveal_1.2s_ease-out] tracking-[0.2em]"
          style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}
        >
          打造你的理想之城
        </p>

        {/* 菜单面板 */}
        {view === 'main' ? (
          <MainMenu
            hasSaves={hasSaves}
            latestSave={latestSave}
            onContinue={handleContinue}
            onLoadView={() => {
              setSlots(getSaveSlots())
              setView('load')
            }}
            onNewGame={handleNewGame}
            onQuit={onQuit}
          />
        ) : (
          <LoadMenu
            onBack={() => setView('main')}
            onLoad={handleLoadSlot}
            slots={slots}
          />
        )}
      </div>

      {/* 版本信息 */}
      <div
        className="absolute bottom-4 right-4 text-xs text-[var(--game-text-muted)] animate-[versionFadeIn_1s_ease-out_forwards]"
        style={{ opacity: 0, animationDelay: '1.5s' }}
      >
        City Demo v{__APP_VERSION__}
      </div>

      {/* 左下角装饰 */}
      <div
        className="absolute bottom-4 left-4 text-xs text-[var(--game-text-muted)] animate-[versionFadeIn_1s_ease-out_forwards]"
        style={{ opacity: 0, animationDelay: '1.8s' }}
      >
        Powered by Claude Code
      </div>
    </div>
  )
}

function MainMenu({
  hasSaves,
  latestSave,
  onNewGame,
  onContinue,
  onLoadView,
  onQuit,
}: {
  hasSaves: boolean
  latestSave: SaveSlot | null
  onNewGame: () => void
  onContinue: () => void
  onLoadView: () => void
  onQuit: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 min-w-[280px]">
      {/* 继续游戏 - 仅在有存档时显示 */}
      {hasSaves && latestSave && (
        <div
          className="w-full animate-[menuSlideIn_0.5s_ease-out]"
          style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}
        >
          <MenuButton
            description={`第 ${latestSave.day} 天 | $${latestSave.money.toLocaleString()}`}
            onClick={onContinue}
            primary
          >
            继续游戏
          </MenuButton>
        </div>
      )}

      {/* 新游戏 */}
      <div
        className="w-full animate-[menuSlideIn_0.5s_ease-out]"
        style={{
          animationDelay: hasSaves ? '0.6s' : '0.5s',
          animationFillMode: 'backwards',
        }}
      >
        <MenuButton onClick={onNewGame}>新游戏</MenuButton>
      </div>

      {/* 加载存档 */}
      {hasSaves && (
        <div
          className="w-full animate-[menuSlideIn_0.5s_ease-out]"
          style={{ animationDelay: '0.7s', animationFillMode: 'backwards' }}
        >
          <MenuButton onClick={onLoadView}>加载存档</MenuButton>
        </div>
      )}

      {/* 分割线 */}
      <div
        className="w-full my-1 h-px bg-gradient-to-r from-transparent via-[var(--game-wood-light)] to-transparent opacity-40 animate-[menuSlideIn_0.5s_ease-out]"
        style={{
          animationDelay: hasSaves ? '0.8s' : '0.6s',
          animationFillMode: 'backwards',
        }}
      />

      {/* 退出 */}
      <div
        className="w-full animate-[menuSlideIn_0.5s_ease-out]"
        style={{
          animationDelay: hasSaves ? '0.9s' : '0.7s',
          animationFillMode: 'backwards',
        }}
      >
        <MenuButton muted onClick={onQuit}>
          退出游戏
        </MenuButton>
      </div>
    </div>
  )
}

function LoadMenu({
  slots,
  onLoad,
  onBack,
}: {
  slots: SaveSlot[]
  onLoad: (slotId: string) => void
  onBack: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 min-w-[360px] animate-[fadeIn_0.3s_ease-out]">
      {/* 标题 */}
      <div className="w-full text-center mb-1">
        <h2 className="text-lg font-[family-name:var(--font-heading)] text-[var(--game-text-heading)]">
          选择存档
        </h2>
      </div>

      {/* 存档列表 */}
      <div className="w-full max-h-[320px] overflow-y-auto space-y-2">
        {slots.map((slot, index) => (
          <button
            className="w-full text-left game-parchment-bg rounded-[var(--game-radius-md)] p-3 border-2 border-[var(--game-wood)]/30 hover:border-[var(--game-gold)] transition-all cursor-pointer group animate-[menuSlideIn_0.4s_ease-out]"
            key={slot.id}
            onClick={() => onLoad(slot.id)}
            style={{
              animationDelay: `${index * 0.08}s`,
              animationFillMode: 'backwards',
            }}
            type="button"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-[family-name:var(--font-heading)] text-[var(--game-text-heading)] group-hover:text-[var(--game-gold)]  transition-colors">
                  {slot.name}
                  {slot.id === 'autosave' && (
                    <span className="ml-2 text-xs text-[var(--game-gold)]">
                      (自动)
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--game-text-muted)] mt-0.5">
                  第 {slot.day} 天 | ${slot.money.toLocaleString()}
                </div>
              </div>
              <div className="text-xs text-[var(--game-text-muted)] opacity-60">
                {new Date(slot.timestamp).toLocaleDateString()}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 返回 */}
      <div className="w-full mt-1">
        <GameButton
          className="w-full"
          intent="secondary"
          onClick={onBack}
          variant="action"
        >
          返回
        </GameButton>
      </div>
    </div>
  )
}

function MenuButton({
  children,
  onClick,
  primary,
  muted,
  description,
}: {
  children: React.ReactNode
  onClick: () => void
  primary?: boolean
  muted?: boolean
  description?: string
}) {
  return (
    <button
      className={`
        w-full relative overflow-hidden rounded-[var(--game-radius-md)] border-2 transition-all cursor-pointer group
        ${
          primary
            ? 'bg-gradient-to-r from-[var(--game-gold)] to-[var(--game-gold-light)] border-[var(--game-wood)] text-[var(--game-text-heading)] shadow-[0_4px_16px_oklch(0.72_0.14_75/0.3)] hover:shadow-[0_6px_24px_oklch(0.72_0.14_75/0.4)] hover:scale-[1.02] active:scale-[0.98]'
            : muted
              ? 'bg-transparent border-transparent text-[var(--game-text-muted)] hover:text-[var(--game-text)] hover:border-[var(--game-wood)]/20'
              : 'game-parchment-bg border-[var(--game-wood)]/40 text-[var(--game-text)] hover:border-[var(--game-gold)] hover:shadow-[0_2px_12px_oklch(0.72_0.14_75/0.15)] active:scale-[0.98]'
        }
        ${primary ? 'py-3.5 px-6' : 'py-3 px-6'}
      `}
      onClick={onClick}
      type="button"
    >
      <span
        className={`font-[family-name:var(--font-heading)] ${primary ? 'text-lg' : 'text-base'}`}
      >
        {children}
      </span>
      {description && (
        <span className="block text-xs mt-0.5 opacity-70 font-[family-name:var(--font-body)]">
          {description}
        </span>
      )}
    </button>
  )
}

function CitySkyline() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 远景建筑剪影 - 上方 */}
      <svg
        className="absolute bottom-[15%] left-0 w-full opacity-[0.06]"
        preserveAspectRatio="none"
        viewBox="0 0 1200 200"
      >
        <path
          d="M0,200 L0,140 L40,140 L40,100 L60,100 L60,80 L80,80 L80,100 L100,100 L100,120 L120,120 L120,60 L140,60 L140,40 L160,40 L160,60 L180,60 L180,120 L200,120 L200,100 L220,100 L220,130 L260,130 L260,90 L280,90 L280,70 L300,70 L300,50 L320,50 L320,70 L340,70 L340,110 L380,110 L380,80 L400,80 L400,120 L440,120 L440,60 L460,60 L460,30 L480,30 L480,60 L500,60 L500,100 L520,100 L520,130 L560,130 L560,90 L580,90 L580,110 L620,110 L620,70 L640,70 L640,50 L660,50 L660,70 L680,70 L680,100 L720,100 L720,120 L760,120 L760,80 L780,80 L780,60 L800,60 L800,40 L820,40 L820,80 L840,80 L840,110 L880,110 L880,90 L900,90 L900,130 L940,130 L940,100 L960,100 L960,70 L980,70 L980,50 L1000,50 L1000,90 L1020,90 L1020,120 L1060,120 L1060,80 L1080,80 L1080,110 L1120,110 L1120,130 L1160,130 L1160,100 L1200,100 L1200,200 Z"
          fill="var(--game-wood-dark)"
        />
      </svg>

      {/* 近景建筑剪影 */}
      <svg
        className="absolute bottom-0 left-0 w-full opacity-[0.04]"
        preserveAspectRatio="none"
        viewBox="0 0 1200 160"
      >
        <path
          d="M0,160 L0,120 L30,120 L30,80 L50,80 L50,60 L70,60 L70,80 L90,80 L90,100 L130,100 L130,70 L150,70 L150,40 L170,40 L170,70 L190,70 L190,100 L230,100 L230,80 L270,80 L270,50 L290,50 L290,30 L310,30 L310,50 L330,50 L330,90 L370,90 L370,110 L410,110 L410,70 L430,70 L430,40 L450,40 L450,20 L470,20 L470,40 L490,40 L490,80 L530,80 L530,100 L570,100 L570,60 L590,60 L590,80 L630,80 L630,110 L670,110 L670,80 L690,80 L690,50 L710,50 L710,30 L730,30 L730,60 L750,60 L750,90 L790,90 L790,110 L830,110 L830,70 L850,70 L850,90 L890,90 L890,120 L930,120 L930,80 L950,80 L950,60 L970,60 L970,90 L1010,90 L1010,110 L1050,110 L1050,80 L1070,80 L1070,100 L1110,100 L1110,120 L1150,120 L1150,90 L1200,90 L1200,160 Z"
          fill="var(--game-wood)"
        />
      </svg>

      {/* 四角装饰 */}
      <CornerOrnament className="top-4 left-4" />
      <CornerOrnament className="top-4 right-4 -scale-x-100" />
      <CornerOrnament className="bottom-4 left-4 -scale-y-100" />
      <CornerOrnament className="bottom-4 right-4 -scale-x-100 -scale-y-100" />

      {/* 浮动粒子 */}
      <FloatingParticles />
    </div>
  )
}

function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg
      className={`absolute w-16 h-16 opacity-[0.15] ${className}`}
      viewBox="0 0 64 64"
    >
      <path
        d="M4,4 L24,4 C24,4 20,8 20,12 C20,16 24,20 24,20 L4,20 Z"
        fill="var(--game-wood)"
        stroke="var(--game-wood-dark)"
        strokeWidth="0.5"
      />
      <path
        d="M4,4 L4,24 C4,24 8,20 12,20 C16,20 20,24 20,24 L20,4 Z"
        fill="var(--game-wood)"
        stroke="var(--game-wood-dark)"
        strokeWidth="0.5"
      />
      <circle
        cx="4"
        cy="4"
        fill="var(--game-gold)"
        r="2"
        stroke="var(--game-wood-dark)"
        strokeWidth="0.5"
      />
    </svg>
  )
}

function FloatingParticles() {
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left: `${15 + i * 14}%`,
    delay: `${i * 1.5}s`,
    duration: `${6 + i * 0.8}s`,
    size: 2 + (i % 3),
  }))

  return (
    <>
      {particles.map(p => (
        <div
          className="absolute rounded-full bg-[var(--game-gold)] opacity-[0.12] animate-[gentleFloat_6s_ease-in-out_infinite]"
          key={p.id}
          style={{
            left: p.left,
            top: `${20 + (p.id % 4) * 15}%`,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </>
  )
}
