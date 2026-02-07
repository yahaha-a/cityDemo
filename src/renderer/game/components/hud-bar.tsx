import { useEffect, useRef } from 'react'
import { TimeSpeed } from 'shared/types'
import { useEngine } from '../context/game-engine-context'
import { useTimeState } from '../hooks/use-game-selector'
import { Pause, Play, FastForward, Menu } from 'lucide-react'

const SPEED_OPTIONS = [
  { speed: TimeSpeed.Paused, icon: Pause, title: '暂停' },
  { speed: TimeSpeed.Normal, icon: Play, title: '正常' },
  { speed: TimeSpeed.Fast, icon: FastForward, title: '快速' },
]

interface HudBarProps {
  onOpenMenu: () => void
}

export function HudBar({ onOpenMenu }: HudBarProps) {
  const engine = useEngine()
  const time = useTimeState()
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const gameLoop = engine.gameLoop
    if (!gameLoop) return

    const unsubscribe = gameLoop.onFrame(dayProgress => {
      const el = barRef.current
      if (el) {
        const pct = Math.min(dayProgress * 100, 100)
        el.style.width = `${pct}%`
      }
    })

    return unsubscribe
  }, [engine.gameLoop])

  return (
    <div
      className="absolute top-0 left-0 right-0 h-10 bg-[var(--game-wood)] z-10 flex items-center px-3 gap-3 shadow-[0_2px_8px_oklch(0.2_0.05_55/0.3)] border-b-2 border-[var(--game-wood-dark)]"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* 左侧：游戏名称 */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-bold text-[var(--game-parchment)] font-[family-name:var(--font-heading)] truncate">
          City Demo
        </span>
      </div>

      {/* 中间占位 */}
      <div className="flex-1" />

      {/* 中间：日期 + 进度条 + 速度控制 */}
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <span className="text-xs text-[var(--game-parchment)]/70 font-[family-name:var(--font-body)]">
          Day
        </span>
        <span className="font-bold text-white text-sm font-[family-name:var(--font-heading)]">
          {time.day}
        </span>
        <div className="w-16 h-1.5 bg-[var(--game-wood-dark)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--game-gold)] rounded-full"
            ref={barRef}
            style={{ width: '0%' }}
          />
        </div>
        <div className="flex gap-0.5">
          {SPEED_OPTIONS.map(({ speed, icon: Icon, title }) => (
            <button
              className={`w-6 h-6 flex items-center justify-center rounded transition-colors cursor-pointer ${
                time.speed === speed
                  ? 'bg-[var(--game-gold)] text-[var(--game-wood-dark)]'
                  : 'text-[var(--game-parchment)]/70 hover:bg-[var(--game-wood-light)]'
              }`}
              key={speed}
              onClick={() => engine.setTimeSpeed(speed)}
              title={title}
              type="button"
            >
              <Icon size={12} strokeWidth={2.5} />
            </button>
          ))}
        </div>
      </div>

      {/* 中间占位 */}
      <div className="flex-1" />

      {/* 右侧：菜单 */}
      <button
        className="w-7 h-7 flex items-center justify-center rounded-[var(--game-radius-sm)] bg-[var(--game-wood-light)] text-[var(--game-parchment)] hover:bg-[var(--game-parchment)]/20 transition-colors cursor-pointer border border-[var(--game-wood-dark)]/30"
        onClick={onOpenMenu}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        title="菜单"
        type="button"
      >
        <Menu size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}
