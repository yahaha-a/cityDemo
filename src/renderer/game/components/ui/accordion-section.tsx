import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from 'renderer/lib/utils'

export function AccordionSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        className="w-full flex items-center justify-between text-xs text-[var(--game-text-muted)] cursor-pointer py-0.5 hover:text-[var(--game-text)] transition-colors"
        onClick={() => setOpen(prev => !prev)}
        type="button"
      >
        <span className="flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={cn(
            'transition-transform',
            open ? 'rotate-0' : '-rotate-90'
          )}
          size={12}
        />
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  )
}
