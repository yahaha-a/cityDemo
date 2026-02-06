import { useEffect, useRef, useState } from 'react'
import { TimeSpeed } from 'shared/game-types'
import { DAY_DURATION_MS } from '../constants'
import { useEngine } from '../context/game-engine-context'
import { useTimeState, useEconomy } from '../hooks/use-game-selector'
import { GameButton } from './ui/game-button'
import { GamePanel } from './ui/game-panel'
import { satisfactionColor } from './ui/theme'

const SPEED_OPTIONS = [
  { speed: TimeSpeed.Paused, label: '||', title: '暂停' },
  { speed: TimeSpeed.Normal, label: '>', title: '正常' },
  { speed: TimeSpeed.Fast, label: '>>', title: '快速' },
  { speed: TimeSpeed.Ultra, label: '>>>', title: '极速' },
]

export function TimeControl() {
  const engine = useEngine()
  const time = useTimeState()
  const economy = useEconomy()
  const [progress, setProgress] = useState(0)
  const animFrameRef = useRef<number>(0)

  useEffect(() => {
    const updateProgress = () => {
      const currentTime = engine.stateManager.getState().time
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
  }, [engine.stateManager])

  return (
    <GamePanel className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 flex items-center gap-4">
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
          <GameButton
            intent={time.speed === speed ? 'active' : 'default'}
            key={speed}
            onClick={() => engine.stateManager.setTimeSpeed(speed)}
            title={title}
            variant="speed"
          >
            {label}
          </GameButton>
        ))}
      </div>

      {/* 经济概况 */}
      <div className="text-xs border-l border-gray-700 pl-4 space-y-0.5">
        <div className="flex gap-3">
          <span className="text-green-400">+${economy.income}/d</span>
          <span className="text-red-400">-${economy.expenses}/d</span>
        </div>
        <div className="flex gap-3">
          <span className="text-gray-400">
            Pop: {economy.population}/{economy.populationCapacity}
          </span>
          <span
            className={
              economy.lastDayRevenue >= 0 ? 'text-green-300' : 'text-red-300'
            }
          >
            Net: {economy.lastDayRevenue >= 0 ? '+' : ''}$
            {economy.lastDayRevenue}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-gray-500">满意度</span>
          <span className={satisfactionColor(economy.satisfaction)}>
            {Math.round(economy.satisfaction)}%
          </span>
        </div>
      </div>
    </GamePanel>
  )
}
