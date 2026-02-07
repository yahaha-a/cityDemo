import { useState, useCallback, useRef, useEffect } from 'react'
import type { SaveSlot } from '../systems/save-system'
import { useEngine } from '../context/game-engine-context'
import { GameButton } from './ui/game-button'
import { ModalOverlay } from './ui/modal-overlay'
import { ConfirmDialog } from './menu/confirm-dialog'
import { MenuStatsView } from './menu/menu-stats-view'
import { MenuGuideView } from './menu/menu-guide-view'
import { MenuSettingsView } from './menu/menu-settings-view'
import { ChevronRight } from 'lucide-react'

interface GameMenuProps {
  onResetGame: () => void
  onReturnToStart?: () => void
  isOpen: boolean
  onClose: () => void
}

type MenuView = 'main' | 'save' | 'load' | 'stats' | 'guide' | 'settings'
type ConfirmAction = 'reset' | 'returnToStart' | null

const VIEW_TITLES: Record<MenuView, string> = {
  main: '游戏菜单',
  save: '保存游戏',
  load: '加载存档',
  stats: '游戏统计',
  guide: '操作指南',
  settings: '游戏设置',
}

export function GameMenu({
  onResetGame,
  onReturnToStart,
  isOpen,
  onClose,
}: GameMenuProps) {
  const engine = useEngine()
  const [view, setView] = useState<MenuView>('main')
  const [slots, setSlots] = useState<SaveSlot[]>([])
  const [newSaveName, setNewSaveName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 组件卸载时清理 timeout
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current)
      }
    }
  }, [])

  // 打开时刷新存档列表
  useEffect(() => {
    if (isOpen) {
      setView('main')
      setSlots(engine.getSaveSlots())
      setConfirmAction(null)
    }
  }, [isOpen, engine])

  // Escape 键：确认弹窗打开时优先关闭弹窗
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmAction) {
          e.stopPropagation()
          setConfirmAction(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, confirmAction])

  const showMessage = (msg: string) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current)
    }
    setMessage(msg)
    messageTimeoutRef.current = setTimeout(() => setMessage(null), 2000)
  }

  const refreshSlots = useCallback(() => {
    setSlots(engine.getSaveSlots())
  }, [engine])

  const closeMenu = () => {
    onClose()
    setView('main')
    setNewSaveName('')
    setConfirmAction(null)
  }

  const handleSaveView = () => {
    refreshSlots()
    setView('save')
  }

  const handleLoadView = () => {
    refreshSlots()
    setView('load')
  }

  const handleCreateSave = () => {
    const name = newSaveName.trim() || `存档 ${new Date().toLocaleString()}`
    const success = engine.createNewSave(name)
    if (success) {
      showMessage('保存成功')
      setNewSaveName('')
      refreshSlots()
    } else {
      showMessage('保存失败 - 存档已满')
    }
  }

  const handleOverwriteSave = (slotId: string, name: string) => {
    const success = engine.saveToSlot(slotId, name)
    showMessage(success ? '保存成功' : '保存失败')
    refreshSlots()
  }

  const handleLoad = (slotId: string) => {
    const success = engine.loadFromSlot(slotId)
    if (success) {
      showMessage('加载成功')
      closeMenu()
    } else {
      showMessage('加载失败')
    }
  }

  const handleDelete = (slotId: string) => {
    const success = engine.deleteSlot(slotId)
    showMessage(success ? '已删除' : '删除失败')
    refreshSlots()
  }

  const handleConfirm = () => {
    if (confirmAction === 'reset') {
      onResetGame()
      closeMenu()
      showMessage('已重新开始')
    } else if (confirmAction === 'returnToStart') {
      onReturnToStart?.()
    }
    setConfirmAction(null)
  }

  return (
    <>
      {/* 消息提示 */}
      {message && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 game-parchment-bg border border-[var(--game-wood)] text-[var(--game-text)] px-4 py-2 rounded-[var(--game-radius-md)] text-sm z-50 shadow-[var(--game-shadow-panel)] animate-[slideDown_0.2s_ease-out]">
          {message}
        </div>
      )}

      {/* 模态框 */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-40">
          <ModalOverlay
            className="fixed z-auto cursor-default"
            onClick={closeMenu}
          />

          {/* 菜单面板 - 皮革书封面风格 */}
          <div className="relative bg-gradient-to-b from-[var(--game-wood)] to-[var(--game-wood-dark)] rounded-[var(--game-radius-lg)] border-4 border-[var(--game-wood-dark)] shadow-[0_8px_32px_oklch(0.2_0.05_55/0.4)] min-w-[380px] max-h-[80vh] overflow-hidden">
            {/* 内页羊皮纸 */}
            <div className="m-2 game-parchment-bg rounded-[var(--game-radius-md)] overflow-hidden">
              {/* 标题栏 */}
              <div className="flex items-center justify-between px-4 py-3 border-b-2 border-dashed border-[var(--game-wood-light)]">
                <h2 className="text-lg font-[family-name:var(--font-heading)] text-[var(--game-text-heading)]">
                  {VIEW_TITLES[view]}
                </h2>
              </div>

              {/* 主菜单 */}
              {view === 'main' && (
                <div className="p-2">
                  {/* 游戏操作 */}
                  <GameButton
                    className="w-full mb-1"
                    onClick={closeMenu}
                    variant="menu"
                  >
                    继续游戏
                  </GameButton>
                  <MenuItemWithChevron
                    label="保存游戏"
                    onClick={handleSaveView}
                  />
                  <MenuItemWithChevron
                    label="加载存档"
                    onClick={handleLoadView}
                  />

                  {/* 分割线 */}
                  <div className="my-2 border-t border-dashed border-[var(--game-wood-light)]" />

                  {/* 信息与设置 */}
                  <MenuItemWithChevron
                    label="游戏统计"
                    onClick={() => setView('stats')}
                  />
                  <MenuItemWithChevron
                    label="操作指南"
                    onClick={() => setView('guide')}
                  />
                  <MenuItemWithChevron
                    label="游戏设置"
                    onClick={() => setView('settings')}
                  />

                  {/* 分割线 */}
                  <div className="my-2 border-t border-dashed border-[var(--game-wood-light)]" />

                  {/* 危险操作 */}
                  <GameButton
                    className="w-full mb-1"
                    onClick={() => setConfirmAction('reset')}
                    variant="menu"
                  >
                    重新开始
                  </GameButton>
                  {onReturnToStart && (
                    <GameButton
                      className="w-full"
                      onClick={() => setConfirmAction('returnToStart')}
                      variant="menu"
                    >
                      返回主菜单
                    </GameButton>
                  )}
                </div>
              )}

              {/* 保存界面 */}
              {view === 'save' && (
                <div className="p-3">
                  <div className="mb-3">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 bg-[var(--game-parchment-light)] border border-[var(--game-wood)]/40 rounded-[var(--game-radius-sm)] px-3 py-2 text-sm text-[var(--game-text)] placeholder-[var(--game-text-muted)] focus:outline-none focus:border-[var(--game-gold)]"
                        onChange={e => setNewSaveName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateSave()}
                        placeholder="输入存档名称..."
                        type="text"
                        value={newSaveName}
                      />
                      <GameButton
                        className="text-sm"
                        disabled={slots.length >= engine.getMaxSlots()}
                        intent="primary"
                        onClick={handleCreateSave}
                        variant="action"
                      >
                        保存
                      </GameButton>
                    </div>
                    <div className="text-xs text-[var(--game-text-muted)] mt-1">
                      已用 {slots.length} / {engine.getMaxSlots()} 个存档位
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {slots.map(slot => (
                      <SaveSlotItem
                        key={slot.id}
                        onDelete={() => handleDelete(slot.id)}
                        onSelect={() => handleOverwriteSave(slot.id, slot.name)}
                        selectLabel="覆盖"
                        slot={slot}
                      />
                    ))}
                    {slots.length === 0 && (
                      <div className="text-center text-[var(--game-text-muted)] py-4 text-sm">
                        暂无存档
                      </div>
                    )}
                  </div>

                  <GameButton
                    className="w-full mt-3"
                    intent="secondary"
                    onClick={() => setView('main')}
                    variant="action"
                  >
                    返回
                  </GameButton>
                </div>
              )}

              {/* 加载界面 */}
              {view === 'load' && (
                <div className="p-3">
                  <div className="max-h-[350px] overflow-y-auto space-y-2">
                    {slots.map(slot => (
                      <SaveSlotItem
                        key={slot.id}
                        onDelete={() => handleDelete(slot.id)}
                        onSelect={() => handleLoad(slot.id)}
                        selectLabel="加载"
                        slot={slot}
                      />
                    ))}
                    {slots.length === 0 && (
                      <div className="text-center text-[var(--game-text-muted)] py-8 text-sm">
                        暂无存档
                      </div>
                    )}
                  </div>

                  <GameButton
                    className="w-full mt-3"
                    intent="secondary"
                    onClick={() => setView('main')}
                    variant="action"
                  >
                    返回
                  </GameButton>
                </div>
              )}

              {/* 统计视图 */}
              {view === 'stats' && (
                <MenuStatsView onBack={() => setView('main')} />
              )}

              {/* 操作指南 */}
              {view === 'guide' && (
                <MenuGuideView onBack={() => setView('main')} />
              )}

              {/* 游戏设置 */}
              {view === 'settings' && (
                <MenuSettingsView onBack={() => setView('main')} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 确认弹窗 */}
      {confirmAction === 'reset' && (
        <ConfirmDialog
          confirmLabel="重新开始"
          intent="danger"
          message="当前未保存的进度将会丢失，确定要重新开始吗？"
          onCancel={() => setConfirmAction(null)}
          onConfirm={handleConfirm}
          title="重新开始"
        />
      )}
      {confirmAction === 'returnToStart' && (
        <ConfirmDialog
          confirmLabel="返回主菜单"
          intent="danger"
          message="当前未保存的进度将会丢失，确定要返回主菜单吗？"
          onCancel={() => setConfirmAction(null)}
          onConfirm={handleConfirm}
          title="返回主菜单"
        />
      )}
    </>
  )
}

function MenuItemWithChevron({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <GameButton
      className="w-full mb-1 flex items-center justify-between"
      onClick={onClick}
      variant="menu"
    >
      <span>{label}</span>
      <ChevronRight className="text-[var(--game-text-muted)]" size={16} />
    </GameButton>
  )
}

function SaveSlotItem({
  slot,
  onSelect,
  onDelete,
  selectLabel,
}: {
  slot: SaveSlot
  onSelect: () => void
  onDelete: () => void
  selectLabel: string
}) {
  const isAutoSave = slot.id === 'autosave'

  return (
    <div className="bg-[var(--game-parchment-light)] rounded-[var(--game-radius-md)] p-3 flex items-center gap-3 border border-[var(--game-wood)]/20">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[var(--game-text-heading)] truncate">
          {slot.name}
          {isAutoSave && (
            <span className="ml-2 text-xs text-[var(--game-gold)]">(自动)</span>
          )}
        </div>
        <div className="text-xs text-[var(--game-text-muted)] mt-0.5">
          第 {slot.day} 天 | ${slot.money.toLocaleString()}
        </div>
        <div className="text-xs text-[var(--game-text-muted)] opacity-60 mt-0.5">
          {new Date(slot.timestamp).toLocaleString()}
        </div>
      </div>
      <div className="flex gap-2">
        <GameButton
          className="px-3 py-1.5 text-xs"
          intent="primary"
          onClick={onSelect}
          variant="action"
        >
          {selectLabel}
        </GameButton>
        {!isAutoSave && (
          <GameButton
            className="px-3 py-1.5 text-xs"
            intent="danger"
            onClick={onDelete}
            variant="action"
          >
            删除
          </GameButton>
        )}
      </div>
    </div>
  )
}
