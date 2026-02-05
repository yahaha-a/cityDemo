import { useEffect, useRef, useState } from 'react'
import { TimeSpeed } from 'shared/game-types'
import type { GameStateManager } from '../engine/game-state'
import type { GameState } from 'shared/game-types'
import { DAY_DURATION_MS } from '../constants'

interface TimeControlProps {
  state: GameState
  stateManager: GameStateManager
}

const SPEED_OPTIONS = [
  { speed: TimeSpeed.Paused, label: '||', title: '暂停' },
  { speed: TimeSpeed.Normal, label: '>', title: '正常' },
  { speed: TimeSpeed.Fast, label: '>>', title: '快速' },
  { speed: TimeSpeed.Ultra, label: '>>>', title: '极速' },
]

export function TimeControl({ state, stateManager }: TimeControlProps) {
  const { time, economy } = state
  const [progress, setProgress] = useState(0)
  const animFrameRef = useRef<number>(0)

  // 使用 requestAnimationFrame 平滑更新进度条
  useEffect(() => {
    const updateProgress = () => {
      const currentTime = stateManager.getState().time
      const dayProgress = (currentTime.tickAccumulator / DAY_DURATION_MS) * 100
      setProgress(Math.min(dayProgress, 100))
      animFrameRef.current = requestAnimationFrame(updateProgress)
    }

    animFrameRef.current = requestAnimationFrame(updateProgress)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [stateManager])

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/90 rounded-lg px-4 py-2 border border-gray-700 select-none flex items-center gap-4">
      {/* 天数 */}
      <div className="text-sm text-gray-300">
        <span className="text-gray-500">Day</span>{' '}
        <span className="font-bold text-white">{time.day}</span>
      </div>

      {/* 天进度条 */}
      <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-400 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 速度控制 */}
      <div className="flex gap-1">
        {SPEED_OPTIONS.map(({ speed, label, title }) => (
          <button
            className={`
              px-2 py-1 text-xs rounded transition-colors font-mono
              ${
                time.speed === speed
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }
            `}
            key={speed}
            onClick={() => stateManager.setTimeSpeed(speed)}
            title={title}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {/* 经济概况 */}
      <div className="text-xs border-l border-gray-700 pl-4 space-y-0.5">
        <div className="flex gap-3">
          <span className="text-green-400">+${economy.income}/d</span>
          <span className="text-red-400">-${economy.expenses}/d</span>
        </div>
        <div className="flex gap-3">
          <span className="text-gray-400">Pop: {economy.population}</span>
          <span
            className={
              economy.lastDayRevenue >= 0 ? 'text-green-300' : 'text-red-300'
            }
          >
            Net: {economy.lastDayRevenue >= 0 ? '+' : ''}$
            {economy.lastDayRevenue}
          </span>
        </div>
      </div>
    </div>
  )
}
