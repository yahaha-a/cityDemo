import { useState, useCallback, useRef, useEffect } from 'react'
import type { SaveSlot } from '../systems/save-system'
import { useEngine } from '../context/game-engine-context'
import { GameButton } from './ui/game-button'
import { ModalOverlay } from './ui/modal-overlay'

interface GameMenuProps {
  onNewGame: () => void
  isOpen: boolean
  onClose: () => void
}

type MenuView = 'main' | 'save' | 'load'

export function GameMenu({ onNewGame, isOpen, onClose }: GameMenuProps) {
  const { saveSystem } = useEngine()
  const [view, setView] = useState<MenuView>('main')
  const [slots, setSlots] = useState<SaveSlot[]>([])
  const [newSaveName, setNewSaveName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
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
      setSlots(saveSystem.getSaveSlots())
    }
  }, [isOpen, saveSystem])

  const showMessage = (msg: string) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current)
    }
    setMessage(msg)
    messageTimeoutRef.current = setTimeout(() => setMessage(null), 2000)
  }

  const refreshSlots = useCallback(() => {
    setSlots(saveSystem.getSaveSlots())
  }, [saveSystem])

  const closeMenu = () => {
    onClose()
    setView('main')
    setNewSaveName('')
  }

  const handleNewGame = () => {
    onNewGame()
    closeMenu()
    showMessage('已开始新游戏')
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
    const success = saveSystem.createNewSave(name)
    if (success) {
      showMessage('保存成功')
      setNewSaveName('')
      refreshSlots()
    } else {
      showMessage('保存失败 - 存档已满')
    }
  }

  const handleOverwriteSave = (slotId: string, name: string) => {
    const success = saveSystem.saveToSlot(slotId, name)
    showMessage(success ? '保存成功' : '保存失败')
    refreshSlots()
  }

  const handleLoad = (slotId: string) => {
    const success = saveSystem.loadFromSlot(slotId)
    if (success) {
      showMessage('加载成功')
      closeMenu()
    } else {
      showMessage('加载失败')
    }
  }

  const handleDelete = (slotId: string) => {
    const success = saveSystem.deleteSlot(slotId)
    showMessage(success ? '已删除' : '删除失败')
    refreshSlots()
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
          <div className="relative bg-gradient-to-b from-[var(--game-wood)] to-[var(--game-wood-dark)] rounded-[var(--game-radius-lg)] border-4 border-[var(--game-wood-dark)] shadow-[0_8px_32px_oklch(0.2_0.05_55/0.4)] min-w-[340px] max-h-[80vh] overflow-hidden">
            {/* 内页羊皮纸 */}
            <div className="m-2 game-parchment-bg rounded-[var(--game-radius-md)] overflow-hidden">
              {/* 标题栏 */}
              <div className="flex items-center justify-between px-4 py-3 border-b-2 border-dashed border-[var(--game-wood-light)]">
                <h2 className="text-lg font-[family-name:var(--font-heading)] text-[var(--game-text-heading)]">
                  {view === 'main' && '游戏菜单'}
                  {view === 'save' && '保存游戏'}
                  {view === 'load' && '加载游戏'}
                </h2>
              </div>

              {/* 主菜单 */}
              {view === 'main' && (
                <div className="p-2">
                  <GameButton
                    className="w-full mb-1"
                    onClick={handleNewGame}
                    variant="menu"
                  >
                    新游戏
                  </GameButton>
                  <GameButton
                    className="w-full mb-1"
                    onClick={handleSaveView}
                    variant="menu"
                  >
                    保存游戏
                  </GameButton>
                  <GameButton
                    className="w-full mb-1"
                    onClick={handleLoadView}
                    variant="menu"
                  >
                    加载游戏
                  </GameButton>
                  <div className="my-2 border-t border-dashed border-[var(--game-wood-light)]" />
                  <GameButton
                    className="w-full"
                    onClick={() => window.App.quit()}
                    variant="menu"
                  >
                    退出游戏
                  </GameButton>
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
                        disabled={slots.length >= saveSystem.getMaxSlots()}
                        intent="primary"
                        onClick={handleCreateSave}
                        variant="action"
                      >
                        保存
                      </GameButton>
                    </div>
                    <div className="text-xs text-[var(--game-text-muted)] mt-1">
                      已用 {slots.length} / {saveSystem.getMaxSlots()} 个存档位
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
            </div>
          </div>
        </div>
      )}
    </>
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
