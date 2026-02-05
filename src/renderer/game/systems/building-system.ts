import { TileType, ToolType, toolToTileType } from 'shared/game-types'
import { BUILDING_COSTS, DEMOLISH_REFUND_RATIO } from '../constants'
import type { GameStateManager } from '../engine/game-state'
import { isInBounds } from '../input/coordinate-utils'

/**
 * 建筑放置系统
 */
export class BuildingSystem {
  private stateManager: GameStateManager

  constructor(stateManager: GameStateManager) {
    this.stateManager = stateManager
  }

  /**
   * 尝试在指定位置执行当前工具操作
   * @returns 是否操作成功
   */
  tryAction(x: number, y: number): boolean {
    if (!isInBounds(x, y)) return false

    const state = this.stateManager.getState()
    const { currentTool } = state

    if (currentTool === ToolType.Select) return false
    if (currentTool === ToolType.Demolish) return this.demolish(x, y)

    return this.build(x, y, currentTool)
  }

  private build(x: number, y: number, tool: ToolType): boolean {
    const tileType = toolToTileType[tool]
    if (!tileType) return false

    const currentTile = this.stateManager.getTileAt(x, y)
    if (!currentTile || currentTile.type !== TileType.Empty) return false

    const cost = BUILDING_COSTS[tileType as keyof typeof BUILDING_COSTS]
    if (cost === undefined) return false

    if (!this.stateManager.spendMoney(cost)) return false

    this.stateManager.setTileAt(x, y, tileType, 1)
    return true
  }

  private demolish(x: number, y: number): boolean {
    const currentTile = this.stateManager.getTileAt(x, y)
    if (!currentTile || currentTile.type === TileType.Empty) return false

    // 退还部分费用
    const cost = BUILDING_COSTS[currentTile.type as keyof typeof BUILDING_COSTS]
    if (cost !== undefined) {
      this.stateManager.addMoney(Math.floor(cost * DEMOLISH_REFUND_RATIO))
    }

    this.stateManager.setTileAt(x, y, TileType.Empty, 0)
    return true
  }
}
