import { useSyncExternalStore } from 'react'
import type { GameState } from 'shared/game-types'
import type { GameStateManager } from '../engine/game-state'

/**
 * 订阅游戏状态 Hook
 * 使用 useSyncExternalStore 确保与 React 并发模式兼容
 */
export function useGameState(stateManager: GameStateManager): GameState {
  return useSyncExternalStore(stateManager.subscribe, stateManager.getSnapshot)
}
