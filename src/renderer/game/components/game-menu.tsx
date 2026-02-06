import { useState, useCallback, useRef, useEffect } from 'react'
import type { SaveSlot } from '../systems/save-system'
import { useEngine } from '../context/game-engine-context'
import { GameButton } from './ui/game-button'
import { ModalOverlay } from './ui/modal-overlay'

interface GameMenuProps {
  onNewGame: () => void
}

type MenuView = 'main' | 'save' | 'load'

export function GameMenu({ onNewGame }: GameMenuProps) {
  const { saveSystem } = useEngine()
  const [isOpen, setIsOpen] = useState(false)
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

  const showMessage = (msg: string) => {
    // 清理之前的 timeout
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current)
    }
    setMessage(msg)
    messageTimeoutRef.current = setTimeout(() => setMessage(null), 2000)
  }

  const refreshSlots = useCallback(() => {
    setSlots(saveSystem.getSaveSlots())
  }, [saveSystem])

  const openMenu = () => {
    setIsOpen(true)
    setView('main')
    refreshSlots()
  }

  const closeMenu = () => {
    setIsOpen(false)
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
      {/* 菜单按钮 */}
      <GameButton
        className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg"
        intent="default"
        onClick={openMenu}
        variant="action"
      >
        菜单
      </GameButton>

      {/* 消息提示 */}
      {message && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm z-50">
          {message}
        </div>
      )}

      {/* 模态框 */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-40">
          {/* 背景遮罩 */}
          <ModalOverlay
            className="fixed z-auto cursor-default"
            onClick={closeMenu}
          />

          {/* 菜单面板 */}
          <div className="relative bg-gray-900 rounded-xl border border-gray-700 shadow-2xl min-w-[320px] max-h-[80vh] overflow-hidden">
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">
                {view === 'main' && '游戏菜单'}
                {view === 'save' && '保存游戏'}
                {view === 'load' && '加载游戏'}
              </h2>
              <button
                className="text-gray-400 hover:text-white text-xl leading-none"
                onClick={closeMenu}
                type="button"
              >
                x
              </button>
            </div>

            {/* 主菜单 */}
            {view === 'main' && (
              <div className="p-2">
                <MenuButton onClick={handleNewGame}>新游戏</MenuButton>
                <MenuButton onClick={handleSaveView}>保存游戏</MenuButton>
                <MenuButton onClick={handleLoadView}>加载游戏</MenuButton>
              </div>
            )}

            {/* 保存界面 */}
            {view === 'save' && (
              <div className="p-3">
                {/* 新建存档 */}
                <div className="mb-3">
                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
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
                  <div className="text-xs text-gray-500 mt-1">
                    已用 {slots.length} / {saveSystem.getMaxSlots()} 个存档位
                  </div>
                </div>

                {/* 存档列表 */}
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
                    <div className="text-center text-gray-500 py-4 text-sm">
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
                    <div className="text-center text-gray-500 py-8 text-sm">
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
      )}
    </>
  )
}

function MenuButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <GameButton onClick={onClick} variant="menu">
      {children}
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
    <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">
          {slot.name}
          {isAutoSave && (
            <span className="ml-2 text-xs text-yellow-500">(自动)</span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          第 {slot.day} 天 | ${slot.money.toLocaleString()}
        </div>
        <div className="text-xs text-gray-600 mt-0.5">
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
