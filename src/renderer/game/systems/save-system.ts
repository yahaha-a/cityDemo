import type { GameState, SaveData } from 'shared/types'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem } from '../engine/system-registry'

const SAVE_VERSION = '2.0.0'
const STORAGE_KEY = 'city-demo-saves'
const MAX_SAVE_SLOTS = 10
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000 // 5 分钟

export interface SaveSlot {
  id: string
  name: string
  timestamp: number
  day: number
  money: number
  preview?: string // 可选的预览信息
}

/**
 * 存档系统 - 使用 localStorage 存储
 */
export class SaveSystem implements IGameSystem {
  readonly id = 'save'
  private stateManager: GameStateManager
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  /**
   * 创建存档数据
   */
  private createSaveData(name: string): SaveData {
    const state = this.stateManager.getState()
    const { hoveredTile: _hoveredTile, _derived, ...gameState } = state

    return {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      name,
      gameState,
    }
  }

  /**
   * 获取所有存档槽位信息
   */
  getSaveSlots(): SaveSlot[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return []

      const saves: Record<string, SaveData> = JSON.parse(data)
      return Object.entries(saves)
        .map(([id, save]) => ({
          id,
          name: save.name,
          timestamp: save.timestamp,
          day: save.gameState.time.day,
          money: save.gameState.money,
        }))
        .sort((a, b) => b.timestamp - a.timestamp)
    } catch {
      return []
    }
  }

  /**
   * 保存到指定槽位
   */
  saveToSlot(slotId: string, name: string): boolean {
    try {
      const saveData = this.createSaveData(name)
      const data = localStorage.getItem(STORAGE_KEY)
      const saves: Record<string, SaveData> = data ? JSON.parse(data) : {}

      saves[slotId] = saveData
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves))
      return true
    } catch (error) {
      console.error('Save failed:', error)
      return false
    }
  }

  /**
   * 创建新存档
   */
  createNewSave(name: string): boolean {
    const slots = this.getSaveSlots()

    // 检查是否超过最大存档数
    if (slots.length >= MAX_SAVE_SLOTS) {
      return false
    }

    const slotId = `save-${Date.now()}`
    return this.saveToSlot(slotId, name)
  }

  /**
   * 从指定槽位加载
   */
  loadFromSlot(slotId: string): boolean {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return false

      const saves: Record<string, SaveData> = JSON.parse(data)
      const saveData = saves[slotId]
      if (!saveData) return false

      this.applySaveData(saveData)
      return true
    } catch (error) {
      console.error('Load failed:', error)
      return false
    }
  }

  /**
   * 删除指定槽位
   */
  deleteSlot(slotId: string): boolean {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return false

      const saves: Record<string, SaveData> = JSON.parse(data)
      delete saves[slotId]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves))
      return true
    } catch {
      return false
    }
  }

  /**
   * 快速保存（自动覆盖 autosave 槽位）
   */
  quickSave(): boolean {
    return this.saveToSlot('autosave', 'Auto Save')
  }

  /**
   * 快速加载
   */
  quickLoad(): boolean {
    return this.loadFromSlot('autosave')
  }

  /**
   * 应用存档数据
   */
  private applySaveData(saveData: SaveData): void {
    const fullState: GameState = {
      ...saveData.gameState,
      hoveredTile: null,
      selectedBuildingId: null,
      buildingRotation: 0,
      buildingEffects: saveData.gameState.buildingEffects ?? {
        tileEffects: {},
        globalSatisfactionMod: 0,
        incomeMultByCategory: {
          residential: 1,
          commercial: 1,
          industrial: 1,
          service: 1,
        },
        effMultByCategory: {
          residential: 1,
          commercial: 1,
          industrial: 1,
          service: 1,
        },
        totalMaintenance: 0,
        totalResearchPoints: 0,
        avgCrisisResistance: 0,
        resources: {
          laborSupply: 0,
          laborDemand: 0,
          laborFulfillment: 1,
          goodsSupply: 0,
          goodsDemand: 0,
          goodsFulfillment: 1,
          servicesSupply: 0,
          servicesDemand: 0,
          servicesFulfillment: 1,
        },
      },
      _derived: { mapStats: null },
    }
    this.stateManager.loadState(fullState)
  }

  /**
   * 启动自动存档
   */
  startAutoSave(): void {
    if (this.autoSaveTimer) return

    this.autoSaveTimer = setInterval(() => {
      this.quickSave()
      console.log('[AutoSave] Game saved')
    }, AUTO_SAVE_INTERVAL)
  }

  /**
   * 停止自动存档
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  /**
   * 检查是否有自动存档
   */
  hasAutoSave(): boolean {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return false
      const saves: Record<string, SaveData> = JSON.parse(data)
      return !!saves.autosave
    } catch {
      return false
    }
  }

  /**
   * 获取最大存档槽数
   */
  getMaxSlots(): number {
    return MAX_SAVE_SLOTS
  }
}
