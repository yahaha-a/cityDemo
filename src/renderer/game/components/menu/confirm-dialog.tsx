import { GameButton } from '../ui/game-button'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  intent?: 'danger' | 'primary'
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  onConfirm,
  onCancel,
  intent = 'danger',
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        onKeyDown={() => {}}
        role="presentation"
      />
      <div className="relative bg-gradient-to-b from-[var(--game-wood)] to-[var(--game-wood-dark)] rounded-[var(--game-radius-lg)] border-4 border-[var(--game-wood-dark)] shadow-[0_8px_32px_oklch(0.2_0.05_55/0.5)] min-w-[300px] animate-[scaleIn_0.15s_ease-out]">
        <div className="m-2 game-parchment-bg rounded-[var(--game-radius-md)] p-4">
          <h3 className="text-base font-[family-name:var(--font-heading)] text-[var(--game-text-heading)] mb-2">
            {title}
          </h3>
          <p className="text-sm text-[var(--game-text)] mb-4">{message}</p>
          <div className="flex gap-2 justify-end">
            <GameButton intent="secondary" onClick={onCancel} variant="action">
              {cancelLabel}
            </GameButton>
            <GameButton intent={intent} onClick={onConfirm} variant="action">
              {confirmLabel}
            </GameButton>
          </div>
        </div>
      </div>
    </div>
  )
}
