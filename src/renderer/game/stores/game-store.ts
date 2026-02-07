import { create } from 'zustand'
import type { GameState } from 'shared/types'
import type { GameEngineFacade } from '../context/engine-facade'
import type { StateKey } from '../engine/game-state'

interface GameStore {
  /** 从 GameStateManager 同步的完整游戏状态快照 */
  state: GameState | null

  /** Engine Facade 引用 */
  engine: GameEngineFacade | null

  /** 绑定 Engine 并开始自动同步 */
  setEngine(engine: GameEngineFacade): () => void
}

// 场景和 UI 实际关心的状态键：
// map / economy → Buildings, TerrainGrid, RoadNetwork
// hoveredTile / currentTool → HoverIndicator
// 其余高频变更（camera 等）不需要同步到 store
// 排除 camera（由 drei MapControls 直接控制，不需要同步到 store）
const SYNC_KEYS: StateKey[] = [
  'map',
  'economy',
  'hoveredTile',
  'currentTool',
  'money',
  'time',
  'events',
  'policies',
  'tech',
  'synergy',
  'facilities',
  'specialization',
  'milestones',
  'challenge',
  'populationFloat',
  'mapSeed',
  '_derived',
]

export const useGameStore = create<GameStore>(set => ({
  state: null,
  engine: null,

  setEngine(engine: GameEngineFacade) {
    // 初始同步
    set({ engine, state: engine.getSnapshot() })

    // 按键订阅：仅在关心的状态键变更时同步
    const unsub = engine.subscribeKeys(SYNC_KEYS, () => {
      set({ state: engine.getSnapshot() })
    })

    return unsub
  },
}))
