import { cn } from 'renderer/lib/utils'

interface PopupMenuProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

/** 弹出菜单壳：backdrop + 定位容器 */
export function PopupMenu({ open, onClose, children }: PopupMenuProps) {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-10"
        onClick={onClose}
        onKeyDown={() => {}}
        role="presentation"
      />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 flex flex-col gap-1 p-2 bg-[var(--game-parchment)] border-2 border-[var(--game-wood)] rounded-[var(--game-radius-lg)] shadow-[0_4px_16px_oklch(0.2_0.05_55/0.3)] animate-[scaleIn_0.15s_ease-out]">
        {children}
      </div>
    </>
  )
}

interface PopupMenuItemProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  active?: boolean
  disabled?: boolean
  cost?: number
  canAfford?: boolean
  extra?: React.ReactNode
  onClick: () => void
}

/** 弹出菜单项：图标 + 标签 + 费用 + active/disabled 样式 */
export function PopupMenuItem({
  icon: Icon,
  label,
  active,
  disabled,
  cost,
  canAfford = true,
  extra,
  onClick,
}: PopupMenuItemProps) {
  return (
    <button
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-[var(--game-radius-sm)] text-xs transition-all border whitespace-nowrap cursor-pointer',
        active
          ? 'bg-[var(--game-gold)] border-[var(--game-wood-dark)] text-[var(--game-text-heading)]'
          : !disabled
            ? 'bg-[var(--game-parchment-light)] border-[var(--game-wood)]/30 text-[var(--game-text)] hover:bg-[var(--game-parchment-dark)]'
            : 'opacity-40 cursor-not-allowed border-[var(--game-wood)]/20 text-[var(--game-text-muted)]'
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon size={14} />
      <span>{label}</span>
      {extra}
      {cost != null && (
        <span
          className={cn(
            'ml-auto text-[10px]',
            canAfford ? 'text-[var(--game-green)]' : 'text-[var(--game-red)]'
          )}
        >
          ${cost}
        </span>
      )}
    </button>
  )
}
