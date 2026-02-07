import { create } from 'zustand'
import type { GameState } from 'shared/types'
import type { GameEngineFacade } from '../context/engine-facade'

interface GameStore {
  /** 从 GameStateManager 同步的完整游戏状态快照 */
  state: GameState | null

  /** Engine Facade 引用 */
  engine: GameEngineFacade | null

  /** 绑定 Engine 并开始自动同步 */
  setEngine(engine: GameEngineFacade): () => void
}

export const useGameStore = create<GameStore>(set => ({
  state: null,
  engine: null,

  setEngine(engine: GameEngineFacade) {
    // 初始同步
    set({ engine, state: engine.getSnapshot() })

    // 订阅后续变更
    const unsub = engine.subscribe(() => {
      set({ state: engine.getSnapshot() })
    })

    return unsub
  },
}))
