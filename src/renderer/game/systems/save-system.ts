import type { GameState, SaveData } from 'shared/types'
import { DemandLevel, TerrainType } from 'shared/types'
import type { GameStateManager } from '../engine/game-state'
import type { IGameSystem } from '../engine/system-registry'
import { EVENT_BASE_COOLDOWN, MAP_WIDTH, MAP_HEIGHT } from '../config'

const SAVE_VERSION = '1.3.0'
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

      // 尝试迁移旧版本存档
      const migrated = this.migrateSaveData(saveData)

      this.applySaveData(migrated)
      return true
    } catch (error) {
      console.error('Load failed:', error)
      return false
    }
  }

  /**
   * 迁移旧版本存档数据
   */
  private migrateSaveData(saveData: SaveData): SaveData {
    if (saveData.version === SAVE_VERSION) return saveData

    const gs = saveData.gameState as Record<string, unknown>

    // v1.0.0 → v1.1.0: 添加供需经济字段
    if (gs.populationFloat === undefined) {
      gs.populationFloat = 0
    }

    const economy = gs.economy as Record<string, unknown>
    if (economy && economy.satisfaction === undefined) {
      economy.satisfaction = 75
      economy.populationCapacity = 0
      economy.resources = {
        labor: { supply: 0, demand: 0, ratio: 1 },
        goods: { supply: 0, demand: 0, ratio: 1 },
        services: { supply: 0, demand: 0, ratio: 1 },
      }
      economy.demandIndicators = {
        residential: DemandLevel.Balanced,
        commercial: DemandLevel.Balanced,
        industrial: DemandLevel.Balanced,
      }
      economy.efficiencyByType = {
        residential: 1,
        commercial: 1,
        industrial: 1,
      }
    }

    // v1.1.0 → v1.2.0: 添加地形、事件、里程碑字段
    // 为所有瓦片添加 terrain 属性
    const map = gs.map as { tiles: Array<Array<Record<string, unknown>>> }
    if (map?.tiles) {
      for (let y = 0; y < MAP_HEIGHT && y < map.tiles.length; y++) {
        for (let x = 0; x < MAP_WIDTH && x < map.tiles[y].length; x++) {
          const tile = map.tiles[y][x]
          if (tile.terrain === undefined) {
            tile.terrain = TerrainType.Plain
          }
        }
      }
    }

    if (gs.mapSeed === undefined) {
      gs.mapSeed = Date.now()
    }

    if (gs.events === undefined) {
      gs.events = {
        activeEvents: [],
        eventCooldown: EVENT_BASE_COOLDOWN,
        eventHistory: [],
        unlockedEventIds: [],
      }
    }

    if (gs.milestones === undefined) {
      gs.milestones = {
        achieved: [],
        satisfactionStreak: 0,
        cumulativeIncome: 0,
        upgradeLv3Unlocked: false,
        pendingRewards: [],
      }
    }

    // v1.2.0 → v1.3.0: 添加新系统状态字段
    if (gs.synergy === undefined) {
      gs.synergy = {
        tileEffects: {},
        globalSatisfactionMod: 0,
        incomeMultByType: { residential: 1, commercial: 1, industrial: 1 },
        effMultByType: { residential: 1, commercial: 1, industrial: 1 },
      }
    }

    if (gs.facilities === undefined) {
      gs.facilities = {
        coverage: {},
        totalMaintenance: 0,
        totalResearchPoints: 0,
        avgCrisisResistance: 0,
      }
    }

    if (gs.policies === undefined) {
      gs.policies = {
        activePolicies: [],
        cooldowns: {},
        unlockedPolicies: [],
      }
    }

    if (gs.challenge === undefined) {
      gs.challenge = {
        challengeMode: false,
        pendingCrisis: null,
        activeCrises: [],
        deficitDays: 0,
        lowSatisfactionDays: 0,
        gameOver: false,
        gameWon: false,
        winProgress: 0,
        score: 0,
      }
    }

    if (gs.tech === undefined) {
      gs.tech = {
        researched: [],
        currentResearch: null,
        researchProgress: 0,
        dailyRP: 0,
        unlockedBuildings: [],
        unlockedPolicies: [],
        unlockedSpecializations: [],
        permanentMultipliers: {},
      }
    }

    if (gs.specialization === undefined) {
      gs.specialization = {
        chosen: null,
        available: [],
      }
    }

    if (gs.structures === undefined) {
      gs.structures = {
        instances: {},
        tileToStructure: {},
      }
    }

    if (gs.productionChains === undefined) {
      gs.productionChains = {
        activeChains: {},
      }
    }

    saveData.version = SAVE_VERSION
    console.log('[SaveSystem] Migrated save data to', SAVE_VERSION)
    return saveData
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
      selectedStructureTemplate: null,
      productionChains: saveData.gameState.productionChains ?? {
        activeChains: {},
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
