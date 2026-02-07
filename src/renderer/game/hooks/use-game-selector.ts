import { useRef, useSyncExternalStore } from 'react'
import type { GameState } from 'shared/types'
import { useEngine } from '../context/game-engine-context'
import type { StateKey } from '../engine/game-state'

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
 * 可选 keys 参数限制订阅范围，可选 equalFn 避免引用不同导致的不必要重渲染
 */
export function useGameSelector<T>(
  selector: (state: GameState) => T,
  options?: {
    keys?: StateKey[]
    equalFn?: (a: T, b: T) => boolean
  }
): T {
  const engine = useEngine()
  const prevRef = useRef<T | undefined>(undefined)
  const equalFn = options?.equalFn
  const keys = options?.keys

  const subscribe = keys
    ? (listener: () => void) => engine.subscribeKeys(keys, listener)
    : engine.subscribe

  return useSyncExternalStore(subscribe, () => {
    const next = selector(engine.getSnapshot())
    if (prevRef.current !== undefined && equalFn?.(prevRef.current, next)) {
      return prevRef.current
    }
    prevRef.current = next
    return next
  })
}

export { shallowEqual }

// 便捷 hooks — 每个声明关注的 StateKey
export function useMoney() {
  return useGameSelector(s => s.money, { keys: ['money'] })
}

export function useCurrentTool() {
  return useGameSelector(s => s.currentTool, { keys: ['currentTool'] })
}

export function useEconomy() {
  return useGameSelector(s => s.economy, { keys: ['economy'] })
}

export function useTimeState() {
  return useGameSelector(s => s.time, { keys: ['time'] })
}

export function useEvents() {
  return useGameSelector(s => s.events, { keys: ['events'] })
}

export function useMilestones() {
  return useGameSelector(s => s.milestones, { keys: ['milestones'] })
}

export function usePolicies() {
  return useGameSelector(s => s.policies, { keys: ['policies'] })
}

export function useTechState() {
  return useGameSelector(s => s.tech, { keys: ['tech'] })
}

export function useChallenge() {
  return useGameSelector(s => s.challenge, { keys: ['challenge'] })
}

export function useSpecialization() {
  return useGameSelector(s => s.specialization, { keys: ['specialization'] })
}

export function useHoveredTile() {
  return useGameSelector(s => s.hoveredTile, { keys: ['hoveredTile'] })
}

export function useMap() {
  return useGameSelector(s => s.map, { keys: ['map'] })
}

export function useMapStats() {
  return useGameSelector(s => s._derived.mapStats, {
    keys: ['_derived'],
  })
}
