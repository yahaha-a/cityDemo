import { useRef, useSyncExternalStore } from 'react'
import type { GameState } from 'shared/game-types'
import { useEngine } from '../context/game-engine-context'

function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true
  if (
    typeof a !== 'object' ||
    a === null ||
    typeof b !== 'object' ||
    b === null
  )
    return false
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (
      !Object.hasOwn(b as Record<string, unknown>, key) ||
      !Object.is(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    )
      return false
  }
  return true
}

/**
 * 选择器式状态订阅
 * 使用 useSyncExternalStore 确保与 React 并发模式兼容
 * 可选 equalFn 避免返回对象时因引用不同导致的不必要重渲染
 */
export function useGameSelector<T>(
  selector: (state: GameState) => T,
  equalFn?: (a: T, b: T) => boolean
): T {
  const engine = useEngine()
  const prevRef = useRef<T | undefined>(undefined)
  return useSyncExternalStore(engine.stateManager.subscribe, () => {
    const next = selector(engine.stateManager.getSnapshot())
    if (prevRef.current !== undefined && equalFn?.(prevRef.current, next)) {
      return prevRef.current
    }
    prevRef.current = next
    return next
  })
}

export { shallowEqual }

// 便捷 hooks
export function useMoney() {
  return useGameSelector(s => s.money)
}

export function useCurrentTool() {
  return useGameSelector(s => s.currentTool)
}

export function useEconomy() {
  return useGameSelector(s => s.economy)
}

export function useTimeState() {
  return useGameSelector(s => s.time)
}

export function useEvents() {
  return useGameSelector(s => s.events)
}

export function useMilestones() {
  return useGameSelector(s => s.milestones)
}

export function usePolicies() {
  return useGameSelector(s => s.policies)
}

export function useTechState() {
  return useGameSelector(s => s.tech)
}

export function useChallenge() {
  return useGameSelector(s => s.challenge)
}

export function useSpecialization() {
  return useGameSelector(s => s.specialization)
}

export function useHoveredTile() {
  return useGameSelector(s => s.hoveredTile)
}

export function useMap() {
  return useGameSelector(s => s.map)
}
