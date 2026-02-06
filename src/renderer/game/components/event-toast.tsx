import { useEffect, useState } from 'react'
import type { GameState } from 'shared/game-types'
import { MILESTONES } from '../constants'

interface ToastMessage {
  id: number
  text: string
  type: 'milestone' | 'event_start' | 'event_end'
}

let toastIdCounter = 0

interface EventToastProps {
  state: GameState
}

export function EventToast({ state }: EventToastProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [prevAchieved, setPrevAchieved] = useState<string[]>(
    state.milestones.achieved
  )
  const [prevActiveEventIds, setPrevActiveEventIds] = useState<string[]>(
    state.events.activeEvents.map(e => e.id)
  )

  useEffect(() => {
    const newToasts: ToastMessage[] = []

    // 检查新达成的里程碑
    for (const id of state.milestones.achieved) {
      if (!prevAchieved.includes(id)) {
        const milestone = MILESTONES.find(m => m.id === id)
        if (milestone) {
          newToasts.push({
            id: ++toastIdCounter,
            text: `里程碑达成: ${milestone.name}`,
            type: 'milestone',
          })
        }
      }
    }

    // 检查新事件开始
    const currentEventIds = state.events.activeEvents.map(e => e.id)
    for (const event of state.events.activeEvents) {
      if (!prevActiveEventIds.includes(event.id)) {
        newToasts.push({
          id: ++toastIdCounter,
          text: `事件: ${event.name} - ${event.description}`,
          type: 'event_start',
        })
      }
    }

    // 检查事件结束
    for (const id of prevActiveEventIds) {
      if (!currentEventIds.includes(id)) {
        newToasts.push({
          id: ++toastIdCounter,
          text: '事件已结束',
          type: 'event_end',
        })
      }
    }

    if (newToasts.length > 0) {
      setToasts(prev => [...prev, ...newToasts])
    }

    setPrevAchieved(state.milestones.achieved)
    setPrevActiveEventIds(currentEventIds)
  }, [state.milestones.achieved, state.events.activeEvents])

  // 自动移除过期的 toast
  useEffect(() => {
    if (toasts.length === 0) return
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1))
    }, 3000)
    return () => clearTimeout(timer)
  }, [toasts])

  if (toasts.length === 0) return null

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col gap-2 pointer-events-none z-50">
      {toasts.map(toast => (
        <div
          className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-[fadeIn_0.3s_ease-in] ${
            toast.type === 'milestone'
              ? 'bg-yellow-600/90 text-yellow-100'
              : toast.type === 'event_start'
                ? 'bg-blue-600/90 text-blue-100'
                : 'bg-gray-600/90 text-gray-100'
          }`}
          key={toast.id}
        >
          {toast.text}
        </div>
      ))}
    </div>
  )
}
