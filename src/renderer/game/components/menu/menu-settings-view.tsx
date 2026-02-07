import { useState, useEffect } from 'react'
import { useEngine } from '../../context/game-engine-context'
import { GameButton } from '../ui/game-button'

interface MenuSettingsViewProps {
  onBack: () => void
}

const SETTINGS_KEY = 'city-demo-settings'

interface GameSettings {
  autoSave: boolean
}

function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return JSON.parse(raw) as GameSettings
  } catch {
    // ignore
  }
  return { autoSave: true }
}

function saveSettings(settings: GameSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function MenuSettingsView({ onBack }: MenuSettingsViewProps) {
  const engine = useEngine()
  const [settings, setSettings] = useState<GameSettings>(loadSettings)

  useEffect(() => {
    if (settings.autoSave) {
      engine.startAutoSave()
    } else {
      engine.stopAutoSave()
    }
  }, [settings.autoSave, engine])

  const toggleAutoSave = () => {
    const next = { ...settings, autoSave: !settings.autoSave }
    setSettings(next)
    saveSettings(next)
  }

  return (
    <div className="p-3">
      <div className="space-y-3">
        {/* 自动存档 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-[var(--game-text)]">自动存档</div>
            <div className="text-[10px] text-[var(--game-text-muted)]">
              定期自动保存游戏进度
            </div>
          </div>
          <button
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border ${
              settings.autoSave
                ? 'bg-[var(--game-green)] border-[var(--game-green)]'
                : 'bg-[var(--game-parchment-dark)] border-[var(--game-wood)]/40'
            }`}
            onClick={toggleAutoSave}
            type="button"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.autoSave ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </div>

      <GameButton
        className="w-full mt-4"
        intent="secondary"
        onClick={onBack}
        variant="action"
      >
        返回
      </GameButton>
    </div>
  )
}
