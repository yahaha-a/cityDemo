import { useState, useCallback, useRef, useEffect } from 'react'
import type { SaveSystem, SaveSlot } from '../systems/save-system'

interface GameMenuProps {
  saveSystem: SaveSystem
  onNewGame: () => void
}

type MenuView = 'main' | 'save' | 'load'

export function GameMenu({ saveSystem, onNewGame }: GameMenuProps) {
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
      <button
        className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/90 text-gray-300 px-4 py-1.5 rounded-lg border border-gray-700 text-sm hover:bg-gray-800 transition-colors"
        onClick={openMenu}
        type="button"
      >
        菜单
      </button>

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
          <button
            aria-label="关闭菜单"
            className="absolute inset-0 bg-black/60 cursor-default border-none"
            onClick={closeMenu}
            type="button"
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
                    <button
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 disabled:opacity-50"
                      disabled={slots.length >= saveSystem.getMaxSlots()}
                      onClick={handleCreateSave}
                      type="button"
                    >
                      保存
                    </button>
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

                <button
                  className="w-full mt-3 px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600"
                  onClick={() => setView('main')}
                  type="button"
                >
                  返回
                </button>
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

                <button
                  className="w-full mt-3 px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600"
                  onClick={() => setView('main')}
                  type="button"
                >
                  返回
                </button>
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
    <button
      className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-800 rounded transition-colors"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
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
        <button
          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-500"
          onClick={onSelect}
          type="button"
        >
          {selectLabel}
        </button>
        {!isAutoSave && (
          <button
            className="px-3 py-1.5 bg-red-600/80 text-white text-xs rounded hover:bg-red-500"
            onClick={onDelete}
            type="button"
          >
            删除
          </button>
        )}
      </div>
    </div>
  )
}
