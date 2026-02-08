import type { ToolType, TimeSpeed, GameState, MilestoneReward } from 'shared/types'
import type { BuildingId } from 'shared/types/building-defs'
import type { GameLoop } from '../engine/game-loop'
import type { StateKey } from '../engine/game-state'

/** 状态监听器 */
type StateListener = () => void

/**
 * 游戏引擎的公共接口 — 仅暴露组件需要的操作
 * 不暴露 stateManager、各 system 等内部实现
 */
export interface GameEngineFacade {
  // === 状态订阅 ===
  subscribe(listener: StateListener): () => void
  subscribeKeys(keys: StateKey[], listener: StateListener): () => void
  getSnapshot(): GameState

  // === 工具操作 ===
  setTool(tool: ToolType): void
  setTimeSpeed(speed: TimeSpeed): void
  resetGame(): void
  setSelectedBuildingId(buildingId: BuildingId | null): void
  rotateBuildingCW(): void

  // === 政策系统 ===
  togglePolicy(policyId: string): boolean
  canTogglePolicy(policyId: string): { canToggle: boolean; reason?: string }

  // === 科技系统 ===
  setResearch(techId: string): boolean
  cancelResearch(): void
  canResearch(techId: string): boolean
  getResearchProgress(): number

  // === 危机系统 ===
  resolveCrisis(optionId: string): boolean
  hasFacility(facilityId: BuildingId): boolean
  toggleChallengeMode(): void

  // === 里程碑系统 ===
  consumePendingReward(): MilestoneReward | null

  // === 特色系统 ===
  chooseSpecialization(specId: string): boolean

  // === 存档系统 ===
  getSaveSlots(): Array<{
    id: string
    name: string
    timestamp: number
    day: number
    money: number
  }>
  createNewSave(name: string): boolean
  saveToSlot(slotId: string, name: string): boolean
  loadFromSlot(slotId: string): boolean
  deleteSlot(slotId: string): boolean
  getMaxSlots(): number
  startAutoSave(): void
  stopAutoSave(): void

  // === 游戏循环 ===
  readonly gameLoop: GameLoop | null
}
