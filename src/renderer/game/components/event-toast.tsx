import { useEffect, useRef, useState } from 'react'
import { MILESTONES } from '../constants'
import { useEvents, useMilestones } from '../hooks/use-game-selector'
import { Trophy, Bell } from 'lucide-react'
import { cn } from 'renderer/lib/utils'

interface ToastMessage {
  id: number
  text: string
  type: 'milestone' | 'event_start' | 'event_end'
}

export function EventToast() {
  const events = useEvents()
  const milestones = useMilestones()

  const toastIdRef = useRef(0)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [prevAchieved, setPrevAchieved] = useState<string[]>(
    milestones.achieved
  )
  const [prevActiveEventIds, setPrevActiveEventIds] = useState<string[]>(
    events.activeEvents.map(e => e.id)
  )

  useEffect(() => {
    const newToasts: ToastMessage[] = []

    // 检查新达成的里程碑
    for (const id of milestones.achieved) {
      if (!prevAchieved.includes(id)) {
        const milestone = MILESTONES.find(m => m.id === id)
        if (milestone) {
          newToasts.push({
            id: ++toastIdRef.current,
            text: `里程碑达成: ${milestone.name}`,
            type: 'milestone',
          })
        }
      }
    }

    // 检查新事件开始
    const currentEventIds = events.activeEvents.map(e => e.id)
    for (const event of events.activeEvents) {
      if (!prevActiveEventIds.includes(event.id)) {
        newToasts.push({
          id: ++toastIdRef.current,
          text: `事件: ${event.name} - ${event.description}`,
          type: 'event_start',
        })
      }
    }

    // 检查事件结束
    for (const id of prevActiveEventIds) {
      if (!currentEventIds.includes(id)) {
        newToasts.push({
          id: ++toastIdRef.current,
          text: '事件已结束',
          type: 'event_end',
        })
      }
    }

    if (newToasts.length > 0) {
      setToasts(prev => [...prev, ...newToasts])
    }

    setPrevAchieved(milestones.achieved)
    setPrevActiveEventIds(currentEventIds)
  }, [milestones.achieved, events.activeEvents])

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
    <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col gap-2 pointer-events-none z-50">
      {toasts.map(toast => (
        <div
          className={cn(
            'px-4 py-2 rounded-[var(--game-radius-md)] text-sm font-medium shadow-[var(--game-shadow-panel)] flex items-center gap-2',
            toast.type === 'milestone'
              ? 'game-parchment-bg border-2 border-[var(--game-gold)] text-[var(--game-text-heading)] animate-[stampIn_0.4s_ease-out]'
              : toast.type === 'event_start'
                ? 'game-parchment-bg border border-[var(--game-blue)] text-[var(--game-text)] animate-[slideDown_0.3s_ease-out]'
                : 'bg-[var(--game-parchment-dark)] border border-[var(--game-wood)]/40 text-[var(--game-text-muted)] animate-[slideDown_0.3s_ease-out]'
          )}
          key={toast.id}
        >
          {toast.type === 'milestone' ? (
            <span className="game-seal bg-[var(--game-gold)] text-white w-6 h-6">
              <Trophy size={12} />
            </span>
          ) : toast.type === 'event_start' ? (
            <Bell className="text-[var(--game-blue)]" size={14} />
          ) : null}
          {toast.text}
        </div>
      ))}
    </div>
  )
}
